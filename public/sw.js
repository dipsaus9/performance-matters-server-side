self.addEventListener('install', event => event.waitUntil(
    caches.open('dipsaus-cache')
        .then(cache => cache.addAll([
            '/',
            '/css/main.css',
            '/fonts/CircularStd-Book.woff',
            '/fonts/CircularStd-Bold.woff'
        ]))
        .then(self.skipWaiting())
));

self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then(response => cachePage(request, response))
                .catch(err => getCachedPage(request))
                .catch(err => fetchCoreFile('/'))
        );
    } else {
        event.respondWith(
            fetch(request)
                .catch(err => fetchCoreFile(request.url))
                .catch(err => fetchCoreFile('/'))
        );
    }
});

function fetchCoreFile(url) {
    return caches.open('dipsaus-cache')
        .then(cache => cache.match(url))
        .then(response => response ? response : Promise.reject());
}

function getCachedPage(request) {
    return caches.open('dipsaus-page')
        .then(cache => cache.match(request))
        .then(response => response ? response : Promise.reject());
}

function cachePage(request, response) {
    const clonedResponse = response.clone();
    caches.open('dipsaus-page')
        .then(cache => cache.put(request, clonedResponse));
    return response;
}
