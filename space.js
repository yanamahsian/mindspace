// space.js — живые галактики для пустых страниц
(function () {
  const GALAXIES = [
    "assets/space/galaxy-1.png",
    "assets/space/galaxy-2.png",
    "assets/space/galaxy-3.png",
    "assets/space/galaxy-4.png",
    "assets/space/galaxy-5.png",
    "assets/space/galaxy-6.png",
  ];

  const FRAGS = [
    "assets/space/fragment-1.png",
    "assets/space/fragment-2.png",
    "assets/space/fragment-3.png",
  ];

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function createStage() {
    const stage = document.createElement("div");
    stage.className = "space-stage";

    const bg = document.createElement("div");
    bg.className = "space-bg is-animating";
    bg.style.backgroundImage = `url("${pick(GALAXIES)}")`;

    stage.appendChild(bg);
    document.body.appendChild(stage);

    return { stage, bg };
  }

  function spawnFragments(stage) {
    const count = 9; // количество осколков
    const anims = ["drift1", "drift2", "drift3"];

    for (let i = 0; i < count; i++) {
      const img = document.createElement("img");
      img.className = "space-fragment";
      img.src = pick(FRAGS);
      img.alt = "";

      // разные размеры
      const size = 70 + Math.random() * 120; // 70–190px
      img.style.width = `${size}px`;

      // стартовые позиции чуть за границей экрана
      img.style.left = `${Math.random() * 100}vw`;
      img.style.top = `${Math.random() * 100}vh`;

      // скорость
      const duration = 18 + Math.random() * 22; // 18–40s
      const delay = -(Math.random() * duration); // чтобы они уже "летели"

      // анимация
      const anim = anims[Math.floor(Math.random() * anims.length)];
      img.style.animation = `${anim} ${duration}s linear infinite`;
      img.style.animationDelay = `${delay}s`;

      // небольшая разная прозрачность
      img.style.opacity = (0.55 + Math.random() * 0.35).toFixed(2);

      stage.appendChild(img);
    }
  }

  function cycleBackground(bg) {
    let i = Math.floor(Math.random() * GALAXIES.length);

    setInterval(() => {
      i = (i + 1) % GALAXIES.length;
      bg.style.opacity = "0.0";

      setTimeout(() => {
        bg.style.backgroundImage = `url("${GALAXIES[i]}")`;
        bg.style.opacity = "0.92";
      }, 900);
    }, 18000); // смена каждые 18 секунд
  }

  document.addEventListener("DOMContentLoaded", () => {
    // Включаем галактики только на “пустых” страницах:
    // aroma.html, art.html, artifacts.html
    const path = (location.pathname || "").toLowerCase();
    const isSpacePage =
      path.endsWith("/aroma.html") ||
      path.endsWith("/art.html") ||
      path.endsWith("/artifacts.html");

    if (!isSpacePage) return;

    const { stage, bg } = createStage();
    spawnFragments(stage);
    cycleBackground(bg);
  });
})();
