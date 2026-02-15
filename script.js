/* script.js — AN.KI (архитектурный режим)
   - бургер меню
   - меню заполняется автоматически на всех страницах
   - PWA install button + SW register
*/

(() => {
  // ===== 1) ЕДИНЫЙ СПИСОК МЕНЮ (правится только тут) =====
  const NAV_ITEMS = [
    { href: "/index.html", label: "Главная" },
    { href: "/anki.html", label: "Об учении" },
    { href: "/mypath.html", label: "Мой путь" },
    { href: "/consulting.html", label: "Консультации" },
    { href: "/personalcontact.html", label: "Личный контакт" },
    { href: "/workbooks.html", label: "Воркбуки" },
    { href: "/art.html", label: "Арт" },
    { href: "/aroma.html", label: "Ароматы" },
    { href: "/essays.html", label: "Эссе" },
    { href: "/artifacts.html", label: "Артефакты AN.KI" },
    { href: "/contacts.html", label: "Контакты" }
  ];

  function normalizePath(p) {
    // / -> /index.html
    if (p === "/") return "/index.html";
    return p;
  }

  function fillNavigationEverywhere() {
    const navs = document.querySelectorAll(".drawer-nav");
    if (!navs.length) return;

    const current = normalizePath(location.pathname);

    navs.forEach((nav) => {
      nav.innerHTML = ""; // СНОСИМ то, что было (в т.ч. “урезанное”)
      NAV_ITEMS.forEach((item) => {
        const a = document.createElement("a");
        a.href = item.href;
        a.textContent = item.label;

        if (normalizePath(item.href) === current) a.classList.add("active");

        // чтобы после клика меню не оставалось открытым
        a.addEventListener("click", () => {
          document.body.classList.remove("nav-open");
          const btn = document.querySelector("[data-burger]");
          if (btn) btn.setAttribute("aria-expanded", "false");
        });

        nav.appendChild(a);
      });
    });
  }

  // ===== 2) BURGER =====
  function initBurger() {
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

    btn.addEventListener("click", () => {
      body.classList.contains("nav-open") ? close() : open();
    });
    overlay.addEventListener("click", close);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  // ===== 3) PWA: Service Worker =====
  function initServiceWorker() {
    if (!("serviceWorker" in navigator)) return;

    window.addEventListener("load", async () => {
      try {
        const reg = await navigator.serviceWorker.register("/service-worker.js", { scope: "/" });

        // если есть ожидающий SW — активируем
        if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });

        // когда новый SW установлен — перезагрузим один раз, чтобы подтянуть новый CSS
        reg.addEventListener("updatefound", () => {
          const sw = reg.installing;
          if (!sw) return;
          sw.addEventListener("statechange", () => {
            if (sw.state === "activated") {
              // мягко: только если страница была под старым SW
              if (navigator.serviceWorker.controller) location.reload();
            }
          });
        });
      } catch (err) {
        // молча: чтобы не ломать сайт
        console.warn("SW register failed:", err);
      }
    });
  }

  // ===== 4) PWA: Install button =====
  let deferredPrompt = null;

  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }
  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }

  function initInstallButton() {
    const btn = document.getElementById("installBtn");
    const hint = document.getElementById("installHint");
    if (!btn) return;

    const hide = () => {
      btn.style.display = "none";
      if (hint) hint.style.display = "none";
    };

    if (isStandalone()) return hide();

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e;
      btn.style.display = "inline-flex";
      if (hint) hint.style.display = "none";
    });

    btn.addEventListener("click", async () => {
      if (isIOS()) {
        if (!hint) return;
        hint.style.display = "block";
        hint.textContent = "iPhone/iPad: Поделиться → «На экран Домой»";
        return;
      }
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      hide();
    });
  }

  // ===== 5) ОТКЛЮЧАЕМ “КОСМОС” если он мешает архитектуре =====
  function killCosmosIfExists() {
    const canvas = document.getElementById("stars");
    if (canvas) canvas.style.display = "none";
    const nebula = document.querySelector(".nebula");
    if (nebula) nebula.style.display = "none";
  }

  // ===== INIT =====
  document.addEventListener("DOMContentLoaded", () => {
    fillNavigationEverywhere();
    initBurger();
    initInstallButton();
    initServiceWorker();
    killCosmosIfExists();
  });
})();
