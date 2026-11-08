-- Lifely: Datenbank (idempotent). Zugriff nur über Regeln (RLS), Ansicht mit Key nur über die Funktion «ansicht».

create table if not exists public.dossiers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,       -- das Dossier (Bereiche, Einträge, Dateiverweise)
  guide jsonb not null default '{}'::jsonb,      -- Stand der Geführten Vorsorge (Zeitwahl, Schritt, Verlauf)
  settings jsonb not null default '{}'::jsonb,   -- Sprache, Schriftgrösse, Rundgang gesehen
  updated_at timestamptz not null default now()
);

create table if not exists public.access_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default '',
  key_hash text not null unique,                 -- SHA-256 des Keys; der Key selbst wird nie gespeichert
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  last_used_at timestamptz,
  uses int not null default 0
);
create index if not exists access_keys_user_idx on public.access_keys(user_id);

create table if not exists public.key_attempts (  -- Bremse gegen Raten: nur die Funktion schreibt hier
  ip_hash text not null,
  at timestamptz not null default now(),
  ok boolean not null default false
);
create index if not exists key_attempts_idx on public.key_attempts(ip_hash, at);

create table if not exists public.ai_usage (      -- KI-Aufrufe pro Konto und Tag (Schutz der Gratis-Stufe)
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default current_date,
  n int not null default 0,
  primary key (user_id, day)
);

create or replace function public.lf_touch() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists dossiers_touch on public.dossiers;
create trigger dossiers_touch before update on public.dossiers for each row execute function public.lf_touch();

alter table public.dossiers enable row level security;
alter table public.access_keys enable row level security;
alter table public.key_attempts enable row level security;
alter table public.ai_usage enable row level security;

revoke all on public.dossiers, public.access_keys, public.key_attempts, public.ai_usage from anon, authenticated;
grant select, insert, update, delete on public.dossiers to authenticated;
grant select, insert, delete on public.access_keys to authenticated;
grant update (label, revoked_at) on public.access_keys to authenticated;

drop policy if exists dossiers_own on public.dossiers;
create policy dossiers_own on public.dossiers for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists keys_own on public.access_keys;
create policy keys_own on public.access_keys for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Dateispeicher: privat, je Konto ein eigener Ordner
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dossier-files', 'dossier-files', false, 10485760, array['image/jpeg','image/png','image/webp','image/heic','image/heif','application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 10485760, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists lf_files_select on storage.objects;
drop policy if exists lf_files_insert on storage.objects;
drop policy if exists lf_files_update on storage.objects;
drop policy if exists lf_files_delete on storage.objects;
create policy lf_files_select on storage.objects for select to authenticated using (bucket_id = 'dossier-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy lf_files_insert on storage.objects for insert to authenticated with check (bucket_id = 'dossier-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy lf_files_update on storage.objects for update to authenticated using (bucket_id = 'dossier-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy lf_files_delete on storage.objects for delete to authenticated using (bucket_id = 'dossier-files' and (storage.foldername(name))[1] = auth.uid()::text);

-- Speichern pro Bereich: ändert nur einen Bereich des Dossiers (Zeilenschutz bleibt wirksam), damit sich zwei Tabs nicht überschreiben
create or replace function public.lf_save_section(sec text, val jsonb) returns void language sql security invoker as $$
  update public.dossiers
     set data = jsonb_set(jsonb_set(coalesce(data,'{}'::jsonb), '{sections}', coalesce(data->'sections','{}'::jsonb), true), array['sections', sec], val, true)
   where user_id = auth.uid();
$$;
revoke all on function public.lf_save_section(text, jsonb) from public, anon;
grant execute on function public.lf_save_section(text, jsonb) to authenticated;

-- Sicherheit: Prüfungen und Grenzen
alter table public.access_keys drop constraint if exists access_keys_hash_chk;
alter table public.access_keys add constraint access_keys_hash_chk check (key_hash ~ '^[0-9a-f]{64}$');
alter table public.access_keys drop constraint if exists access_keys_label_chk;
alter table public.access_keys add constraint access_keys_label_chk check (char_length(label) <= 60);
alter table public.dossiers drop constraint if exists dossiers_data_size;
alter table public.dossiers add constraint dossiers_data_size check (pg_column_size(data) < 500000);
alter table public.dossiers drop constraint if exists dossiers_guide_size;
alter table public.dossiers add constraint dossiers_guide_size check (pg_column_size(guide) < 200000);
alter table public.dossiers drop constraint if exists dossiers_settings_size;
alter table public.dossiers add constraint dossiers_settings_size check (pg_column_size(settings) < 200000);

create or replace function public.lf_keys_limit() returns trigger language plpgsql as $$
begin
  if (select count(*) from public.access_keys where user_id = new.user_id and revoked_at is null) >= 20 then
    raise exception 'Zu viele Keys. Bitte widerrufen Sie nicht benötigte Keys.';
  end if;
  return new;
end $$;
drop trigger if exists access_keys_limit on public.access_keys;
create trigger access_keys_limit before insert on public.access_keys for each row execute function public.lf_keys_limit();

-- KI-Tageszähler atomar (nur Service-Rolle)
create or replace function public.lf_ai_take(uid uuid, lim int) returns int language sql security definer set search_path = public as $$
  insert into public.ai_usage (user_id, day, n) values (uid, current_date, 1)
  on conflict (user_id, day) do update set n = ai_usage.n + 1
  returning n;
$$;
revoke all on function public.lf_ai_take(uuid, int) from public, anon, authenticated;
grant execute on function public.lf_ai_take(uuid, int) to service_role;

-- Key-Nutzung atomar zählen (nur Service-Rolle)
create or replace function public.lf_key_use(kid uuid) returns void language sql security definer set search_path = public as $$
  update public.access_keys set uses = uses + 1, last_used_at = now() where id = kid;
$$;
revoke all on function public.lf_key_use(uuid) from public, anon, authenticated;
grant execute on function public.lf_key_use(uuid) to service_role;
