/* =====================================================
   像素橫向前進場景（對應 css/hero.css 的 .pixel-scene）
   1) 離開可視範圍時暫停動畫，重新進入時繼續
   2) 場景黏住期間，依捲動進度依序切換三段文字
   ===================================================== */

/* 離開瀏覽器可視範圍時暫停動畫，重新進入時繼續 */
(function () {
  var scenes = document.querySelectorAll(".pixel-scene");
  if (!scenes.length || !("IntersectionObserver" in window)) return;

  var sceneObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      // 用 ratio 判斷：區塊與視窗僅「邊緣相切」時 isIntersecting 也會是 true
      var visible = entry.isIntersecting && entry.intersectionRatio > 0;
      entry.target.classList.toggle("is-paused", !visible);
    });
  }, { threshold: [0, 0.02] });

  scenes.forEach(function (scene) { sceneObserver.observe(scene); });
})();

/* 滾動敘事：場景黏住期間，依捲動進度依序切換三段文字 */
(function () {
  var story = document.querySelector(".pixel-scene-story");
  if (!story) return;
  var scene = story.querySelector(".pixel-scene");
  if (scene) {
    var stickySupport = (window.CSS && typeof window.CSS.supports === "function" && window.CSS.supports("position", "sticky"));
    var sceneStyle = window.getComputedStyle(scene);
    var stickyEnabled = sceneStyle.position === "sticky";

    function hasStickyBlockingAncestor(el) {
      var node = el.parentElement;
      while (node && node !== document.body && node !== document.documentElement) {
        var cs = window.getComputedStyle(node);
        var hasOverflowBlocker = [cs.overflow, cs.overflowX, cs.overflowY].some(function (v) {
          return v === "hidden" || v === "auto" || v === "scroll" || v === "overlay";
        });
        if (hasOverflowBlocker) return true;
        node = node.parentElement;
      }
      return false;
    }

    if (!stickySupport || !stickyEnabled || hasStickyBlockingAncestor(scene)) {
      story.classList.add("pixel-scene-story--no-sticky");
    }
  }

  var slides = story.querySelectorAll(".pixel-scene__slide");
  if (!slides.length) return;

  var ticking = false;
  function updateStory() {
    ticking = false;
    var total = story.offsetHeight - window.innerHeight;
    if (total <= 0) { slides[0].classList.add("is-active"); return; }
    var p = -story.getBoundingClientRect().top / total;
    p = Math.max(0, Math.min(0.999, p));
    var idx = Math.floor(p * slides.length);
    slides.forEach(function (s, i) { s.classList.toggle("is-active", i === idx); });
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(updateStory); }
  }, { passive: true });
  window.addEventListener("resize", updateStory);
  updateStory();
})();
