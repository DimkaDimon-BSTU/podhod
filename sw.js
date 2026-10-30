// Подход: офлайн-кэш. Файлы приложения отдаются из кэша, а в фоне
// подтягивается свежая версия — обновления появятся при следующем запуске.
const CACHE = 'podhod-v1';
const ASSETS = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // Open Food Facts и прочее — напрямую в сеть

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    let hit = await cache.match(req, { ignoreSearch: true });
    if (!hit && req.mode === 'navigate') hit = await cache.match('./');
    const net = fetch(req)
      .then(res => { if (res.ok) cache.put(req, res.clone()); return res; })
      .catch(() => hit);
    e.waitUntil(net.then(() => {}, () => {}));
    return hit || net;
  })());
});
