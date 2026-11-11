const CACHE = 'smart-city-v1';
const CORE = [
  './', './index.html', './manifest.webmanifest',
  './styles/ui.css', './styles/iriv-tour-media.css',
  './scripts/ui/ui.js', './scripts/ui/install-app.js',
  './scripts/devices/milesight-devices.js', './scripts/devices/device-insights.js',
  './scripts/systems/utilities.js', './scripts/systems/weather.js',
  './scripts/systems/airport.js', './scripts/systems/power-grid.js',
  './scripts/systems/ferry.js', './scripts/systems/logistics.js',
  './scripts/city/city3d-details.js', './scripts/city/city3d-life.js',
  './scripts/city/city3d.js',
  './assets/icons/smart-city-192.png', './assets/icons/smart-city-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('smart-city-') && key !== CACHE).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || request.headers.has('range')) return;
  // Films and narration are large and are streamed by the browser.
  if (/\.(mp4|wav|webm)$/i.test(url.pathname)) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(request, copy));
      }
      return response;
    }).catch(async () => (await caches.match(request)) || (await caches.match('./index.html'))));
    return;
  }

  const updateCache = response => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(request, copy));
    }
    return response;
  };
  if (/\.(js|css|json|webmanifest)$/i.test(url.pathname)) {
    event.respondWith(fetch(request).then(updateCache).catch(() => caches.match(request)));
  } else {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(updateCache)));
  }
});
