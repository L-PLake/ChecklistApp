const CACHE = 'my-offline-checklist-v3';
const CACHE_PREFIX = 'my-offline-checklist-';
const FILES = ['./', './index.html', './manifest.json', './icon.svg'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(async cache => {
    await Promise.all(FILES.map(async file => {
      const response = await fetch(file, { cache: 'reload' });
      if (!response.ok) throw new Error(`Could not cache ${file}: ${response.status}`);
      await cache.put(file, response);
    }));
    await self.skipWaiting();
  }));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(async keys => {
    const previousCaches = keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE);
    await Promise.all(previousCaches.map(key => caches.delete(key)));
    await self.clients.claim();
    if (previousCaches.length) {
      const clients = await self.clients.matchAll({ type: 'window' });
      await Promise.all(clients.map(client => client.navigate(client.url).catch(error => {
        console.error('Could not refresh an open page.', error);
      })));
    }
  }));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(event.request, { cache: 'no-store' });
      if (response.ok) {
        caches.open(CACHE).then(cache => cache.put(event.request, response.clone())).catch(error => console.error('Could not update the offline cache.', error));
      }
      return response;
    } catch (error) {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      if (event.request.mode === 'navigate') {
        const page = await caches.match('./index.html');
        if (page) return page;
      }
      throw error;
    }
  })());
});
self.addEventListener('message', event => {
  if (event.data !== 'CHECK_FOR_UPDATES') return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const cachedPage = await cache.match('./index.html');
    const response = await fetch('./index.html', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Could not check for page updates: ${response.status}`);
    const latestPage = await response.clone().text();
    if (!cachedPage || await cachedPage.text() !== latestPage) {
      await cache.put('./index.html', response.clone());
      const versionMatch = latestPage.match(/<span id="appVersion" aria-label="Version (\d+)">v\d+<\/span>/);
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach(client => client.postMessage({
        type: 'APP_UPDATE_AVAILABLE',
        version: versionMatch ? Number(versionMatch[1]) : null
      }));
    }
  })().catch(error => {
    if (self.navigator.onLine) console.error('Could not check for page updates.', error);
  }));
});
