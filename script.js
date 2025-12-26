// ====== STARFIELD: полёт сквозь звёзды ======
(() => {
  const canvas = document.getElementById('stars');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let w, h, cx, cy;
  const depth = 900;           // глубина космоса
  const starCount = 600;       // звёзд побольше = плотнее полёт
  const stars = [];
  let speed = 0.9;             // скорость полёта (0.4–1.5 ок)

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    cx = w / 2;
    cy = h / 2;
  }
  window.addEventListener('resize', resize);
  resize();

  function makeStar() {
    return {
      x: (Math.random() * 2 - 1) * depth,
      y: (Math.random() * 2 - 1) * depth,
      z: Math.random() * depth + 1
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
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') speed = Math.min(1.8, speed + 0.1);
    if (e.key === 'ArrowDown') speed = Math.max(0.2, speed - 0.1);
  });
})();
// =============== BURGER NAV ===============
(function () {
  const body = document.body;
  const btn = document.querySelector('[data-burger]');
  const overlay = document.querySelector('[data-nav-overlay]');
  const drawer = document.querySelector('[data-nav-drawer]');

  if (!btn || !overlay || !drawer) return;

  const open = () => {
    body.classList.add('nav-open');
    btn.setAttribute('aria-expanded', 'true');
    // фишка: запоминаем состояние
    localStorage.setItem('anki_nav_open', '1');
  };

  const close = () => {
    body.classList.remove('nav-open');
    btn.setAttribute('aria-expanded', 'false');
    localStorage.setItem('anki_nav_open', '0');
  };

  const toggle = () => {
    body.classList.contains('nav-open') ? close() : open();
  };

  btn.addEventListener('click', toggle);
  overlay.addEventListener('click', close);

  // закрыть по ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && body.classList.contains('nav-open')) close();
  });

  // фишка: восстановление состояния (можно удалить, если не надо)
  const saved = localStorage.getItem('anki_nav_open');
  if (saved === '1') open();
})();
// PWA: регистрация Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js");
  });
}
