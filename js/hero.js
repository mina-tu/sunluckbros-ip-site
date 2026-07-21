/* =====================================================
   HERO 開場動畫與貼紙互動（對應 css/hero.css）
   依賴：gsap + Draggable（CDN 已在 index.html 載入）
   ===================================================== */
(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hero = document.querySelector(".homeFv");
  if (!hero) return;

  /* ---- 貼紙：拖曳 ---- */
  if (window.gsap && window.Draggable) {
    gsap.registerPlugin(Draggable);
    document.querySelectorAll(".sticker").forEach(function (el) {
      Draggable.create(el, {
        type: "x,y",
        bounds: hero,
        zIndexBoost: true,
        onPress:   function () { gsap.to(el, { scale: 1.12, duration: 0.2, ease: "power2.out" }); },
        onRelease: function () { gsap.to(el, { scale: 1,    duration: 0.4, ease: "back.out(2.5)" }); }
      });
    });
  }

  /* ---- 貼紙：滾動慣性跟隨 ---- */
  if (!reduced) {
    var lagItems = [];
    document.querySelectorAll(".stickerLag").forEach(function (el) {
      lagItems.push({ el: el, f: parseFloat(el.dataset.lag) || 1, y: 0 });
    });
    if (lagItems.length) {
      var lastY = window.scrollY, vel = 0;
      (function stickerRaf() {
        var s = window.scrollY;
        vel += ((s - lastY) - vel) * 0.15;   // 平滑後的滾動速度
        lastY = s;
        lagItems.forEach(function (o) {
          var target = Math.max(-140, Math.min(140, vel * o.f * 3));
          o.y += (target - o.y) * 0.1;
          o.el.style.transform = "translateY(" + o.y.toFixed(2) + "px)";
        });
        requestAnimationFrame(stickerRaf);
      })();
    }
  }

  /* ---- 第三階段大字：依容器寬度把 SLBROS 撐到滿版 ---- */
  var heroWord = document.querySelector(".heroWord");
  var heroTitle = document.querySelector(".homeFv_title");
  function fitHero() {
    if (!heroWord || !heroTitle) return;
    var cs = getComputedStyle(heroTitle);
    var avail = heroTitle.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    heroWord.style.fontSize = "100px";
    var w = heroWord.getBoundingClientRect().width;
    if (w > 0) heroWord.style.fontSize = (100 * avail * 0.76 / w) + "px";  // 佔容器 76% 寬
  }
  document.fonts.ready.then(fitHero);
  window.addEventListener("resize", fitHero);

  // 無動畫環境：不跑時間軸，直接呈現三層疊滿的完成畫面
  if (reduced || !window.gsap) return;

  /* ---- 三階段時間軸（雲海逐層浮上來） ---- */
  // 開場前先歸位：中、後兩層雲海藏到畫面下方，SLBROS / 貼紙 / header 先隱藏
  gsap.set(".fvBg_mid, .fvBg_dark", { yPercent: 100 });
  gsap.set(".stage1", { opacity: 1 });
  gsap.set(".stage2", { opacity: 1 });
  gsap.set(".stage2 .stageHeadline", { opacity: 0, y: 26 });
  gsap.set(".homeFv_title", { opacity: 0, y: 30 });
  gsap.set(".sticker", { opacity: 0, scale: 0.6 });
  gsap.set(".header, .fvMusic", { autoAlpha: 0 });

  // 等字體載入後再啟動，避免升字時字寬跳動
  document.fonts.ready.then(function () {
    // 第一階段：把 SunLuckBros 拆成單一字母 span，供逐字上升動畫
    var wordEl = document.querySelector(".splashWord");
    wordEl.textContent.split("").forEach(function (ch, i) {
      var sp = document.createElement("span");
      sp.textContent = ch;
      if (i === 0) wordEl.textContent = "";  // 清掉原字串後再逐一 append
      wordEl.appendChild(sp);
    });

    var tl = gsap.timeline();

    // 01 小標與 SunLuckBros 逐字由下往上升起
    tl.from(".stage1 .splashLabel", { y: 18, opacity: 0, duration: 0.5, ease: "power3.out" })
      .from(wordEl.children, { yPercent: 130, duration: 0.6, ease: "power4.out", stagger: 0.05 }, "-=0.15")
      .to({}, { duration: 0.55 })
      // 02 深橘雲海（lg-bg-02）由下往上浮起，第一階段文字往上淡出
      .to(".fvBg_mid", { yPercent: 0, duration: 1.05, ease: "power3.inOut" })
      .to(".stage1", { opacity: 0, y: -50, duration: 0.55, ease: "power2.in" }, "<+=0.15")
      // 雲海到位後，第二階段大標題出現
      .to(".stage2 .stageHeadline", { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" })
      .to({}, { duration: 0.65 })
      // 03 黑色雲海（lg-bg-03）再浮上來，第二階段文字往上淡出
      .to(".fvBg_dark", { yPercent: 0, duration: 1.05, ease: "power3.inOut" })
      .to(".stage2", { opacity: 0, y: -50, duration: 0.55, ease: "power2.in" }, "<+=0.15")
      // 最終：SLBROS、貼紙與 header / 底部標語進場
      .to(".homeFv_title", { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, "-=0.25")
      .to(".sticker", { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)", stagger: 0.06 }, "-=0.45")
      .to(".header, .fvMusic", { autoAlpha: 1, duration: 0.6 }, "<");
  });
})();
