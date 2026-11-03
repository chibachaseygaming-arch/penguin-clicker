const CACHE_NAME = "penguin-clicker-v1";
const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/penguin.svg",
  "./icons/penguin-192.png",
  "./icons/penguin-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key.startsWith("penguin-clicker-") && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  const scopePath = new URL(self.registration.scope).pathname;
  const filePath = url.pathname.slice(scopePath.length);
  const appFile = filePath ? `./${filePath}` : "./";

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await caches.open(CACHE_NAME).then(cache => cache.put("./", response.clone()));
        }
        return response;
      } catch {
        return (await caches.match(request)) || (await caches.match("./index.html"));
      }
    })());
    return;
  }

  if (APP_FILES.includes(appFile)) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request))
    );
  }
});
