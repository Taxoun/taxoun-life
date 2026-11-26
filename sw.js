const CACHE = `elan-v11-${self.registration.scope}`;
const INDEX = new URL('./index.html', self.registration.scope).href;
const ASSETS = [INDEX, './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png']
  .map((path) => new URL(path, self.registration.scope).href);

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    const oldCaches = names.filter((name) => name.startsWith('elan-v')
      && name.endsWith(`-${self.registration.scope}`) && name !== CACHE);
    await Promise.all(oldCaches.map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || !request.url.startsWith(self.registration.scope)) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        return await fetch(request);
      } catch {
        const cache = await caches.open(CACHE);
        return await cache.match(INDEX) ?? Response.error();
      }
    })());
  } else if (ASSETS.includes(request.url)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      return await cache.match(request) ?? fetch(request);
    })());
  }
});
