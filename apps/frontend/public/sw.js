const CACHE_NAME = "azubi-offline-v3";
const OFFLINE_URL = "/offline.html";
const PUBLIC_ASSETS = [
  "/offline.html",
  "/images/Logo_Book.png",
  "/images/avatar.jpg",
  "/images/bg-login.jpg",
];
const PUBLIC_NAVIGATION_ROUTES = new Set(["/", "/login"]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PUBLIC_ASSETS);
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            return caches.delete(key);
          }),
      );
    }),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.mode !== "navigate") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (!PUBLIC_NAVIGATION_ROUTES.has(url.pathname)) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status >= 500) {
          return caches.match(OFFLINE_URL).then((fallback) => {
            return fallback || response;
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(OFFLINE_URL).then((fallback) => {
          return (
            fallback ||
            new Response("Server unavailable", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          );
        });
      }),
  );
});
