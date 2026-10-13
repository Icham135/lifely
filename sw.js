const CACHE = 'lifely-v33';
const FILES = ['./', './index.html', './styles.css?v=33', './i18n.js?v=33', './app.js?v=33', './manifest.json', './icons/logo.svg', './fonts/figtree-latin.woff2'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))));
self.addEventListener('fetch', e => e.request.method === 'GET' && new URL(e.request.url).origin === location.origin && e.respondWith(fetch(e.request).catch(() => caches.match(e.request))));
