#!/bin/bash
# Ersetzt app/ vollständig durch app-neu/ und prüft, dass index.html nur auf existierende Dateien zeigt.
# Idempotent. Basispfad optional als 1. Argument (Standard: Repo-Ordner dieses Skripts).
set -e
BASE="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$BASE"
[ -f app-neu/index.html ] || { echo "FEHLER: app-neu/index.html fehlt"; exit 1; }
mkdir -p app
rsync -a --delete --exclude 'CONTRACT.md' --exclude '.DS_Store' app-neu/ app/
fehler=0
# alle src=/href= in app/index.html (relative Ziele, ohne Query)
for ziel in $(grep -oE '(src|href)="[^"]+"' app/index.html | sed -E 's/^(src|href)="//; s/"$//' | sed -E 's/[?#].*$//'); do
  case "$ziel" in http://*|https://*|//*|data:*|mailto:*|"") continue;; esac
  if [ ! -e "app/$ziel" ]; then echo "FEHLT: app/$ziel"; fehler=1; fi
done
[ "$fehler" = 0 ] && echo "OK: app/ aktualisiert, alle Verweise in index.html vorhanden." || { echo "FEHLER: fehlende Dateien"; exit 1; }
