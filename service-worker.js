var CACHE_NAME = 'gradeguard-v1';
var urlsToCache = [
    '/',
    '/static/icon-192.png',
    '/static/icon-512.png'
];

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request).then(function (response) {
            if (response) return response;
            return fetch(event.request).then(function (response) {
                if (!response || response.status !== 200) return response;
                var responseToCache = response.clone();
                caches.open(CACHE_NAME).then(function (cache) {
                    cache.put(event.request, responseToCache);
                });
                return response;
            });
        })
    );
});