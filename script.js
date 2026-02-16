/* script.js — AN.KI unified nav + stable PWA update */

(() => {
  // 1) ЕДИНСТВЕННОЕ МЕНЮ ДЛЯ ВСЕХ СТРАНИЦ (правда одна)
  // Если какого-то пункта НЕ должно быть — просто удали строку отсюда.
  const NAV_ITEMS = [
    { href: "index.html",          label: "Главная" },
    { href: "anki.html",           label: "Об учении" },
    { href: "mypath.html",         label: "Мой путь" },
    { href: "workbooks.html",      label: "Воркбуки" },
    { href: "art.html",            label: "Арт" },
    { href: "aroma.html",          label: "Ароматы" },
    { href: "essays.html",         label: "Эссе" },
    { href: "artifacts.html",      label: "Артефакты AN.KI" },
    { href: "personalcontact.html",label: "Личный контакт" },
    { href: "contacts.html",       label: "Контакты" }
  ];

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function normalizePath(p) {
    const clean = (p || "").split("?")[0].split("#")[0];
    return clean.endsWith("/") ? (clean + "index.html") : clean;
  }

  function currentFile() {
    const p = normalizePath(location.pathname);
    const file = p.substring(p.lastIndexOf("/") + 1) || "index.html";
    return file;
  }

  // Пересобираем меню на странице(ах), если есть контейнер
  function buildDrawerNav() {
    const active = currentFile();
    $$(".drawer-nav").forEach((nav) => {
      nav.innerHTML = NAV_ITEMS.map((it) => {
        const isActive = it.href === active;
        return `<a href="${it.href}" ${isActive ? 'aria-current="page"' : ""}>${it.label}</a>`;
      }).join("");
    });
  }

  // 2) БУРГЕР: одна логика, без сюрпризов
  function initBurger() {
    const btn = document.querySelector("[data-burger]");
    const overlay = document.querySelector("[data-nav-overlay]");
    const drawer = document.querySelector("[data-nav-drawer]");
    if (!btn || !overlay || !drawer) return;

    function open() {
      document.documentElement.classList.add("nav-open");
      btn.setAttribute("aria-expanded", "true");
    }
    function close() {
      document.documentElement.classList.remove("nav-open");
      btn.setAttribute("aria-expanded", "false");
    }
    function toggle() {
      document.documentElement.classList.contains("nav-open") ? close() : open();
    }

    btn.addEventListener("click", toggle);
    overlay.addEventListener("click", close);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    // Закрыть меню при клике на пункт
    drawer.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (a) close();
    });
  }

  // 3) PWA install UI (если элементы есть)
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
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      installBtn.style.display = "none";
      if (installHint) installHint.style.display = "none";
    });
  }

  // 4) Service Worker: регистрируем с версией (чтобы обновлялся, а не залипал)
  async function initSW() {
    if (!("serviceWorker" in navigator)) return;

    // меняй строку, когда хочешь принудительно обновить SW
    const SW_VERSION = "2026-02-16-1";

    try {
      const reg = await navigator.serviceWorker.register(`/service-worker.js?v=${SW_VERSION}`, {
        scope: "/"
      });

      // если новый SW установился — просим его активироваться
      if (reg.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
      }

      // если SW обновится — перезагрузим страницу один раз
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) return;
        refreshing = true;
        location.reload();
      });
    } catch (err) {
      // не ломаем сайт, если SW не встал
      console.warn("SW register failed:", err);
    }
  }

  // старт
  document.addEventListener("DOMContentLoaded", () => {
    buildDrawerNav();
    initBurger();
    initInstallUI();
    initSW();
  });
})();
