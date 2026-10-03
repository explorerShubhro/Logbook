"use strict";
/*
 * Service worker: makes Logbook open and work with no internet.
 *
 * How it works
 *   - On first visit it saves a copy of every app file (the "app shell").
 *   - After that, each request tries the network first (so you always get the newest
 *     version when online) and falls back to the saved copy when offline or slow.
 *   - Your DATA is not handled here. It lives in the browser's localStorage, which
 *     works offline by itself.
 *
 * You do NOT need to change anything here when you edit app.js: online, the newest
 * files are always fetched and the saved copies refresh automatically.
 * Only edit APP_FILES if you add or rename a file.
 */

const CACHE_NAME = "logbook-shell-v1";
const NETWORK_TIMEOUT_MS = 4000; // on a very slow connection, use the saved copy after this long

const APP_FILES = [
  "./",
  "index.html",
  "app.js",
  "vendor.js",
  "storage.js",
  "styles.css",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
];

const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_FILES.map((file) => new Request(file, { cache: "reload" }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(request));
  } else if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(request)); // fonts rarely change
  }
  // anything else: leave it to the browser
});

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const fresh = await withTimeout(fetch(new Request(request.url, { cache: "no-cache" })), NETWORK_TIMEOUT_MS);
    if (fresh && fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  } catch (error) {
    const saved =
      (await cache.match(request, { ignoreSearch: true })) ||
      (request.mode === "navigate" ? await cache.match("index.html") : undefined);
    if (saved) return saved;
    return new Response("Offline and not saved yet. Open the app once while online.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const saved = await cache.match(request);
  if (saved) return saved;
  try {
    const fresh = await fetch(request);
    if (fresh && (fresh.ok || fresh.type === "opaque")) cache.put(request, fresh.clone());
    return fresh;
  } catch (error) {
    return new Response("", { status: 504 });
  }
}
