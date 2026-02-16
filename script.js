/* script.js — AN.KI "железобетон": unified nav + stable PWA update */
(() => {
  // Защита от двойной загрузки скрипта
  if (window.__ANKI_SCRIPT_INIT__) return;
  window.__ANKI_SCRIPT_INIT__ = true;

  // === 1) ЕДИНСТВЕННОЕ МЕНЮ ДЛЯ ВСЕХ СТРАНИЦ ===
  // ВАЖНО: href тут абсолютные (с /), чтобы не ломалось на любых URL.
  const NAV_ITEMS = [
    { href: "/index.html",           label: "Главная" },
    { href: "/anki.html",            label: "Об учении" },
    { href: "/mypath.html",          label: "Мой путь" },
    { href: "/workbooks.html",       label: "Воркбуки" },
    { href: "/art.html",             label: "Арт" },
    { href: "/aroma.html",           label: "Ароматы" },
    { href: "/essays.html",          label: "Эссе" },
    { href: "/artifacts.html",       label: "Артефакты AN.KI" },
    { href: "/personalcontact.html", label: "Личный контакт" },
    { href: "/contacts.html",        label: "Контакты" }
  ];

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function normalizePathname(pathname) {
    // / -> /index.html
    if (!pathname || pathname === "/") return "/index.html";
    // убираем хвостовой /
    if (pathname.endsWith("/")) return pathname + "index.html";
    return pathname;
  }

  function currentPath() {
    return normalizePathname(window.location.pathname);
  }

  function buildDrawerNav() {
    const activePath = currentPath();

    // На некоторых страницах у тебя может быть 2+ ".drawer-nav" из-за кривой верстки.
    // Мы перезаполняем ВСЕ найденные, чтобы всё было едино.
    const navBlocks = $$(".drawer-nav");
    if (!navBlocks.length) return;

    const html = NAV_ITEMS.map((it) => {
      const isActive = it.href === activePath;
      return `<a href="${it.href}" ${isActive ? 'aria-current="page"' : ""}>${it.label}</a>`;
    }).join("");

    navBlocks.forEach((nav) => {
      nav.innerHTML = html;
    });
  }

  // === 2) БУРГЕР: ОДНА ЛОГИКА, БЕЗ СЮРПРИЗОВ ===
  function initBurger() {
    // Берём первый корректный набор. Если на странице дубль — остальные игнорируем.
    const btn = $("[data-burger]");
    const overlay = $("[data-nav-overlay]");
    const drawer = $("[data-nav-drawer]");

    if (!btn || !overlay || !drawer) return;

    const root = document.documentElement;

    function open() {
      root.classList.add("nav-open");
      btn.setAttribute("aria-expanded", "true");
    }

    function close() {
      root.classList.remove("nav-open");
      btn.setAttribute("aria-expanded", "false");
    }

    function toggle() {
      root.classList.contains("nav-open") ? close() : open();
    }

    // На всякий случай: если уже были слушатели (из-за дублированного script.js),
    // наш гард в начале это предотвращает.
    btn.addEventListener("click", toggle, { passive: true });
    overlay.addEventListener("click", close, { passive: true });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    // Закрыть меню при клике на пункт
    drawer.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (a) close();
    });
  }

  // === 3) PWA Install UI (если элементы есть) ===
  function initInstallUI() {
    const installBtn = document.getElementById("installBtn");
    const installHint = document.getElementById("installHint");
    if (!installBtn) return;

    let deferredPrompt = null;

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e;

      installBtn.style.display = "inline-block";
      if (installHint) {
        installHint.style.display = "block";
        installHint.textContent = "Можно установить как приложение.";
      }
    });

    installBtn.addEventListener("click", async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice.catch(() => null);
      deferredPrompt = null;

      installBtn.style.display = "none";
      if (installHint) installHint.style.display = "none";
    });
  }

  // === 4) Service Worker: чтобы НЕ залипал и обновлялся ===
  async function initSW() {
    if (!("serviceWorker" in navigator)) return;

    // Меняй эту строку при каждом апдейте, когда хочешь "встряхнуть" кеш.
    const SW_VERSION = "2026-02-16-2";

    try {
      const reg = await navigator.serviceWorker.register(`/service-worker.js?v=${SW_VERSION}`, { scope: "/" });

      // Если новый SW уже ждёт — активируем
      if (reg.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
      }

      // Если пришёл новый SW — тоже активируем
      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        if (!sw) return;

        sw.addEventListener("statechange", () => {
          if (sw.state === "installed" && navigator.serviceWorker.controller) {
            sw.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });

      // Перезагрузка один раз после смены контроллера
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    } catch (err) {
      console.warn("SW register failed:", err);
    }
  }

  // Старт
  document.addEventListener("DOMContentLoaded", () => {
    buildDrawerNav();
    initBurger();
    initInstallUI();
    initSW();
  });
})();
