// ====== STARFIELD: полёт сквозь звёзды ======
(() => {
  const canvas = document.getElementById("stars");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let w, h, cx, cy;
  const depth = 900;      // глубина космоса
  const starCount = 600;  // плотность звёзд
  const stars = [];
  let speed = 0.9;        // скорость полёта

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    cx = w / 2;
    cy = h / 2;
  }
  window.addEventListener("resize", resize);
  resize();

  function makeStar() {
    return {
      x: (Math.random() * 2 - 1) * depth,
      y: (Math.random() * 2 - 1) * depth,
      z: Math.random() * depth + 1,
    };
  }

  for (let i = 0; i < starCount; i++) stars.push(makeStar());

  function step() {
    ctx.clearRect(0, 0, w, h);

    for (let s of stars) {
      s.z -= speed;
      if (s.z <= 0.2) Object.assign(s, makeStar());

      // проекция 3D -> 2D
      const k = 220 / s.z; // “фокус”
      const sx = s.x * k + cx;
      const sy = s.y * k + cy;

      // если улетел за экран — переродить
      if (sx < -50 || sx > w + 50 || sy < -50 || sy > h + 50) {
        Object.assign(s, makeStar());
        continue;
      }

      const size = Math.max(0.7, 2.2 - s.z / 500); // ближе — ярче/толще
      const alpha = Math.min(1, 1.2 - s.z / depth);

      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(step);
  }
  step();

  // лёгкий контроль скорости стрелками
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") speed = Math.min(1.8, speed + 0.1);
    if (e.key === "ArrowDown") speed = Math.max(0.2, speed - 0.1);
  });
})();

// =============== BURGER NAV ===============
(function () {
  const body = document.body;
  const btn = document.querySelector("[data-burger]");
  const overlay = document.querySelector("[data-nav-overlay]");
  const drawer = document.querySelector("[data-nav-drawer]");

  if (!btn || !overlay || !drawer) return;

  const open = () => {
    body.classList.add("nav-open");
    btn.setAttribute("aria-expanded", "true");
    localStorage.setItem("anki_nav_open", "1");
  };

  const close = () => {
    body.classList.remove("nav-open");
    btn.setAttribute("aria-expanded", "false");
    localStorage.setItem("anki_nav_open", "0");
  };

  const toggle = () => {
    body.classList.contains("nav-open") ? close() : open();
  };

  btn.addEventListener("click", toggle);
  overlay.addEventListener("click", close);

  // закрыть по ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && body.classList.contains("nav-open")) close();
  });

  // восстановление состояния (если бесит — удалим)
  const saved = localStorage.getItem("anki_nav_open");
  if (saved === "1") open();
})();

// =============== PWA: Service Worker ===============
// ВАЖНО: для домена https://anki.systems/ регистрируем с корня.
(function () {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/service-worker.js");

      // мягко подтягиваем обновление (чтобы не "залипало" на старой версии)
      if (reg && reg.update) reg.update();

      // если уже есть активный SW — ок
      // если новый SW установился — просим его активироваться при следующем заходе
      // (не перезагружаем страницу насильно)
    } catch (e) {
      // намеренно молчим — сайт должен жить даже если SW не зарегистрировался
    }
  });
})();

// =============== PWA Install Button ===============
// Работает так:
// - Android/Chrome/Edge: покажет системное окно установки, когда оно доступно
// - iOS: покажет подсказку “Поделиться → На экран Домой”
let deferredPrompt = null;

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

// Событие приходит ТОЛЬКО если браузер считает, что PWA установима
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

window.addEventListener("appinstalled", () => {
  const btn = document.getElementById("installBtn");
  const hint = document.getElementById("installHint");
  if (btn) btn.style.display = "none";
  if (hint) hint.style.display = "none";
  deferredPrompt = null;
});

window.addEventListener("load", () => {
  const btn = document.getElementById("installBtn");
  const hint = document.getElementById("installHint");
  if (!btn) return;

  // Если уже установлено — прячем всё
  if (isInStandaloneMode()) {
    btn.style.display = "none";
    if (hint) hint.style.display = "none";
    return;
  }

  // iOS: нет системного окна установки
  if (isIOS()) {
    btn.style.display = "inline-flex";
    btn.addEventListener("click", () => {
      if (!hint) return;
      hint.style.display = "block";
      hint.textContent = "iPhone/iPad: Поделиться → «На экран Домой»";
    });
    return;
  }

  // Android/Desktop: если beforeinstallprompt не пришёл — кнопка будет скрыта
  btn.addEventListener("click", async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;

    deferredPrompt = null;
    btn.style.display = "none";
    if (hint) hint.style.display = "none";
  });
});
