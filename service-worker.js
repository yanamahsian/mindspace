/* service-worker.js — AN.KI / Mindspace (anki.systems)
   - работает на корне домена (/)
   - не "залипает" на старой версии
   - даёт нормальную установку PWA
*/

const VERSION = "v2026-02-14-1"; // <-- меняй при каждом апдейте
const CACHE_NAME = `anki-${VERSION}`;

const CORE_ASSETS = [
  "/",                    // главная
  "/index.html",
  "/style.css",
  "/script.js",
  "/anki-logo.png",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

// Установка: кешируем базу
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_ASSETS);
    await self.skipWaiting();
  })());
});

// Активация: удаляем старые кеши
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => k.startsWith("anki-") && k !== CACHE_NAME)
        .map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

// (Опционально) даём странице команду "обновись сейчас"
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Fetch:
// - навигация (HTML): network-first, fallback на кеш и /index.html
// - статика: stale-while-revalidate
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // не трогаем внешние домены
  if (url.origin !== self.location.origin) return;

  // навигация (страницы)
  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req));
    return;
  }

  // статика
  event.respondWith(staleWhileRevalidate(req));
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const fresh = await fetch(req, { cache: "no-store" });
    if (fresh && fresh.ok) cache.put(req, fresh.clone());
    return fresh;
  } catch (e) {
    const cached = await cache.match(req);
    return cached || cache.match("/index.html");
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);

  const fetchPromise = fetch(req)
    .then((fresh) => {
      if (fresh && fresh.ok) cache.put(req, fresh.clone());
      return fresh;
    })
    .catch(() => null);

  return cached || (await fetchPromise) || new Response("", { status: 504 });
}
