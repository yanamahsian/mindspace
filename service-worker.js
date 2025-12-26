/* service-worker.js — Mindspace / AN.KI
   Безопасный вариант для GitHub Pages:
   - кеширует только базовые файлы
   - обновляется без "залипания" на старой версии
*/

const VERSION = "v2025-12-26-1"; // <-- меняй цифру при каждом апдейте (например, +1)
const CACHE_NAME = `mindspace-${VERSION}`;

// ВАЖНО: относительные пути (без ведущего /), чтобы работало в /mindspace/
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./anki-logo.png",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// Установка: кладём базу в кеш
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// Активация: удаляем старые кеши
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("mindspace-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch стратегия:
// - навигация (открытие страниц): network-first, чтобы обновления приходили
// - статика (css/js/png): stale-while-revalidate
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // не трогаем чужие домены (например, Revolut)
  if (url.origin !== self.location.origin) return;

  // HTML навигация
  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req));
    return;
  }

  // Остальная статика
  event.respondWith(staleWhileRevalidate(req));
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const fresh = await fetch(req, { cache: "no-store" });
    // Кешируем копию (только успешные ответы)
    if (fresh && fresh.ok) cache.put(req, fresh.clone());
    return fresh;
  } catch (e) {
    const cached = await cache.match(req);
    return cached || caches.match("./index.html");
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
