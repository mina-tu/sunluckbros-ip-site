/* =====================================================
   像素橫向前進場景（對應 css/hero.css 的 .pixel-scene）
   1) 離開可視範圍時暫停動畫，重新進入時繼續
   2) 進入畫面後三段文字自動輪播
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

/* 自動輪播：場景進入畫面後，三段文字依序自動出現並循環；離開畫面時停止，下次進入從第一段開始 */
(function () {
  var story = document.querySelector(".pixel-scene-story");
  if (!story) return;
  var slides = story.querySelectorAll(".pixel-scene__slide");
  if (!slides.length) return;

  var SLIDE_MS = 1500;
  var idx = 0;
  var timer = null;

  function show(i) {
    idx = i;
    slides.forEach(function (s, n) { s.classList.toggle("is-active", n === i); });
  }

  function start() {
    if (timer) return;
    show(0);
    timer = setInterval(function () { show((idx + 1) % slides.length); }, SLIDE_MS);
  }

  function stop() {
    clearInterval(timer);
    timer = null;
  }

  if (!("IntersectionObserver" in window)) { start(); return; }

  new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) start(); else stop();
    });
  }, { threshold: 0.5 }).observe(story);
})();
