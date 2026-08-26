// Bump this on every deploy so the browser detects the SW file changed
// and installs the new version instead of serving stale cached files forever.
const SW_VERSION = 'v7';
const CACHE_NAME = 'check-reminder-zare-' + SW_VERSION;

// Relative paths (no leading "/") so this works from local files or a local web server.
const STATIC_ASSETS = [
    './',
    './index.html',
    './app.js',
    './check-parser.js',
    './ocr.js',
    './voice.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// Install event - cache assets, activate immediately
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean old caches, take control of open pages right away
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - network-first for our own HTML/JS/JSON (so updates show up
// immediately when online), falling back to cache when offline.
// Everything else uses cache-first for speed.
self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);
    if (!['http:', 'https:'].includes(url.protocol)) return;

    const isAppFile = url.origin === self.location.origin;

    if (isAppFile) {
        event.respondWith(
            fetch(req)
                .then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200) {
                        const clone = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
                    }
                    return networkResponse;
                })
                .catch(() => caches.match(req).then(cached => cached || caches.match('./index.html')))
        );
    } else {
        event.respondWith(
            caches.match(req).then(cached => {
                if (cached) return cached;
                return fetch(req).then(networkResponse => {
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }
                    const clone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
                    return networkResponse;
                });
            })
        );
    }
});

// Push notification event (real push, sent by the backend worker)
self.addEventListener('push', event => {
    let data = {};
    try { data = event.data ? event.data.json() : {}; } catch (e) {
        data = { title: '⏰ یادآوری چک', body: event.data ? event.data.text() : 'سررسید چک نزدیک است!' };
    }
    const title = data.title || '⏰ یادآوری چک';
    const options = {
        body: data.body || 'سررسید چک نزدیک است!',
        icon: 'icon-192.png',
        badge: 'icon-192.png',
        tag: data.tag || 'check-reminder',
        requireInteraction: true,
        actions: [
            { action: 'paid', title: '✓ پاس شده' },
            { action: 'unpaid', title: '✗ پاس نشده' },
            { action: 'open', title: '🔍 مشاهده' }
        ],
        data: data
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click event
self.addEventListener('notificationclick', event => {
    event.notification.close();

    const action = event.action;
    const data = event.notification.data || {};

    event.waitUntil((async () => {
        const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

        if (action === 'paid' || action === 'unpaid') {
            allClients.forEach(client => {
                client.postMessage({
                    action: action,
                    tag: event.notification.tag,
                    checkId: data.checkId
                });
            });
        }

        const scopeUrl = self.registration.scope;
        const existing = allClients.find(c => c.url.startsWith(scopeUrl));
        if (existing) {
            existing.focus();
        } else {
            self.clients.openWindow(scopeUrl);
        }
    })());
});

// Periodic background sync (Chrome/Android only, best-effort catch-up check)
self.addEventListener('periodicsync', event => {
    if (event.tag === 'check-reminders') {
        event.waitUntil(checkReminders());
    }
});

self.addEventListener('sync', event => {
    if (event.tag === 'check-reminders') {
        event.waitUntil(checkReminders());
    }
});

async function checkReminders() {
    // The main app listens for this and evaluates which local reminders are due.
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(client => {
        client.postMessage({ type: 'CHECK_REMINDERS' });
    });
}
