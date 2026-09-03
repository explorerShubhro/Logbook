// This service worker exists purely to satisfy the browser's installability
// requirement (Chrome only offers "Install app" — not just "Create shortcut"
// — for pages with a registered service worker that has a fetch handler).
//
// It intentionally does NOT cache anything. Every request just passes
// straight through to the network. This means no offline support, but it
// also means you'll never get stuck seeing a stale cached version of the
// app after an update — simplicity and freshness over offline capability.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
