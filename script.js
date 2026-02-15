// =============================
// AN.KI — script.js (root domain)
// =============================

// ===== BURGER NAV =====
(function () {
  const body = document.body;
  const btn = document.querySelector("[data-burger]");
  const overlay = document.querySelector("[data-nav-overlay]");
  const drawer = document.querySelector("[data-nav-drawer]");

  if (!btn || !overlay || !drawer) return;

  const open = () => {
    body.classList.add("nav-open");
    btn.setAttribute("aria-expanded", "true");
  };

  const close = () => {
    body.classList.remove("nav-open");
    btn.setAttribute("aria-expanded", "false");
  };

  const toggle = () => {
    body.classList.contains("nav-open") ? close() : open();
  };

  btn.addEventListener("click", toggle);
  overlay.addEventListener("click", close);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && body.classList.contains("nav-open")) close();
  });
})();

// ===== PWA: HARD RESET (без DevTools) =====
// Открой https://anki.systems/?reset=1
// Он удалит SW + все кеши и перезагрузит сайт.
async function pwaHardResetIfRequested() {
  const params = new URLSearchParams(location.search);
  if (params.get("reset") !== "1") return;

  try {
    // unregister service workers
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }

    // delete caches
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }

    // убираем параметр reset и перезагружаем
    const cleanUrl = location.origin + location.pathname;
    location.replace(cleanUrl);
  } catch (e) {
    console.error("PWA reset failed:", e);
    // Даже если не получилось — просто перезагрузим без параметра
    const cleanUrl = location.origin + location.pathname;
    location.replace(cleanUrl);
  }
}
window.addEventListener("load", pwaHardResetIfRequested);

// ===== PWA: Service Worker register (ТОЛЬКО абсолютный путь) =====
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/service-worker.js", { scope: "/" });

      // мягко просим обновиться, если есть ожидание
      if (reg.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
      }

      // периодически проверяем апдейты (без фанатизма)
      setTimeout(() => {
        reg.update().catch(() => {});
      }, 2000);

    } catch (e) {
      console.error("SW register failed:", e);
    }
  });
}

// ===== PWA Install Button (Chrome/Edge/Android + подсказка iOS) =====
let deferredPrompt = null;

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;

  const btn = document.getElementById("installBtn");
  const hint = document.getElementById("installHint");
  if (!btn) return;

  if (!isInStandaloneMode()) {
    btn.style.display = "inline-flex";
    if (hint) hint.style.display = "none";
  }
});

window.addEventListener("load", () => {
  const btn = document.getElementById("installBtn");
  const hint = document.getElementById("installHint");
  if (!btn) return;

  // Если уже установлено — ничего не показываем
  if (isInStandaloneMode()) {
    btn.style.display = "none";
    if (hint) hint.style.display = "none";
    return;
  }

  // iOS: нет системного окна установки, даём подсказку
  if (isIOS()) {
    btn.style.display = "inline-flex";
    btn.addEventListener("click", () => {
      if (!hint) return;
      hint.style.display = "block";
      hint.textContent = "iPhone: Поделиться → «На экран Домой»";
    });
    return;
  }

  // Остальные: кнопка работает только если beforeinstallprompt случился
  btn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    btn.style.display = "none";
    if (hint) hint.style.display = "none";
  });
});
