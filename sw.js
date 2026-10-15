// sw.js — Service worker de la PWA (mínimo y conservador).
//
// Estrategia: network-first para TODO lo mismo-origen. Online se sirve
// siempre la red: los ?v=, el mapa de importes y los despliegues siguen
// mandando sin cambios y nunca se ve una copia vieja. La caché solo actúa
// como respaldo offline y se actualiza con cada respuesta OK.
// Cross-origin (fuentes de Google) y peticiones no-GET: sin interceptar.

const CACHE_NAME = 'web4eso-shell-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) { return cache.addAll(SHELL); })
            .then(function () { return self.skipWaiting(); })
    );
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys()
            .then(function (keys) {
                return Promise.all(
                    keys
                        .filter(function (key) { return key !== CACHE_NAME; })
                        .map(function (key) { return caches.delete(key); })
                );
            })
            .then(function () { return self.clients.claim(); })
    );
});

self.addEventListener('fetch', function (event) {
    const request = event.request;

    if (request.method !== 'GET') return;
    if (new URL(request.url).origin !== self.location.origin) return;

    event.respondWith(
        fetch(request)
            .then(function (response) {
                if (response && response.ok) {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(request, copy);
                    });
                }
                return response;
            })
            .catch(function () {
                return caches.match(request).then(function (cached) {
                    if (cached) return cached;

                    if (request.mode === 'navigate') {
                        // Rutas hash: todo lo de navegación cae en el shell
                        return caches.match('./index.html').then(function (shell) {
                            return shell || offlineResponse();
                        });
                    }

                    return offlineResponse();
                });
            })
    );
});

function offlineResponse() {
    return new Response('Sin conexión', {
        status: 503,
        statusText: 'Offline',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
}
