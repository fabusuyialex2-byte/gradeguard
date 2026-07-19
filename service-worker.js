var CACHE_NAME = 'gradeguard-v2'; // bump this string only if you ever need to force a hard reset of the cache
var urlsToCache = [
    '/',
    '/static/icon-192.png',
    '/static/icon-512.png'
];

self.addEventListener('install', function (event) {
    // Activate this new service worker immediately instead of waiting for every open tab to
    // close first — otherwise an update can sit "installed but not active" indefinitely.
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(urlsToCache);
        })
    );
});

// Cleans up caches left over from older versions once a new one takes over, and takes control
// of any already-open tabs right away rather than waiting for the next full reload.
self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames
                    .filter(function (name) { return name !== CACHE_NAME; })
                    .map(function (name) { return caches.delete(name); })
            );
        }).then(function () {
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', function (event) {
    var req = event.request;

    // NETWORK-FIRST for page loads (this is the actual bug fix). Previously index.html was
    // cached once, the very first time someone visited, and served from that cache forever —
    // meaning a student could be stuck on a months-old version of the app with no way to know
    // it, even after new code was deployed. Now, whenever there's a connection, the freshest
    // version is always fetched from the network first. The cached copy only gets used as a
    // fallback if the request genuinely fails (i.e. the person is offline).
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req).then(function (response) {
                var responseToCache = response.clone();
                caches.open(CACHE_NAME).then(function (cache) { cache.put(req, responseToCache); });
                return response;
            }).catch(function () {
                return caches.match(req).then(function (cached) {
                    return cached || caches.match('/');
                });
            })
        );
        return;
    }

    // CACHE-FIRST for everything else (icons, static assets) — these rarely change, so serving
    // from cache keeps things feeling instant, with the network only used to refresh the cache.
    event.respondWith(
        caches.match(req).then(function (cachedResponse) {
            if (cachedResponse) return cachedResponse;
            return fetch(req).then(function (response) {
                if (!response || response.status !== 200) return response;
                var responseToCache = response.clone();
                caches.open(CACHE_NAME).then(function (cache) { cache.put(req, responseToCache); });
                return response;
            });
        })
    );
});