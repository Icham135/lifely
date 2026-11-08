/* Selbstlöschender Service Worker: ersetzt den alten Zwischenspeicher von Version 1 und meldet sich dann ab. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  try { const ks = await caches.keys(); await Promise.all(ks.map(k => caches.delete(k))); } catch {}
  try { await self.registration.unregister(); } catch {}
  try { const c = await self.clients.matchAll({ type: 'window' }); c.forEach(w => w.navigate(w.url)); } catch {}
})()));
/* fetch: bewusst nicht einmischen */
