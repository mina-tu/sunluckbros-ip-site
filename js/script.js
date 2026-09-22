// ── 防右鍵 / 防拷保護 ──────────────────────────────────
document.addEventListener("contextmenu", (e) => e.preventDefault());

document.addEventListener("keydown", (e) => {
  // 封鎖 F12、Ctrl+Shift+I/J/C/U、Ctrl+U、Ctrl+S、Ctrl+A
  if (
    e.key === "F12" ||
    (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key.toUpperCase())) ||
    (e.ctrlKey && ["U", "S", "A"].includes(e.key.toUpperCase()))
  ) {
    e.preventDefault();
  }
});

document.addEventListener("copy",  (e) => e.preventDefault());
document.addEventListener("cut",   (e) => e.preventDefault());
document.addEventListener("dragstart", (e) => e.preventDefault());

document.addEventListener("selectstart", (e) => e.preventDefault());
// ────────────────────────────────────────────────────────

const menuBtn = document.getElementById("menuBtn");
const menu = document.getElementById("menu");
const header = document.getElementById("header");
const hero = document.getElementById("hero");
const scrollTopBtn = document.getElementById("scrollTopBtn");

menuBtn?.addEventListener("click", () => {
  menuBtn.classList.toggle("active");
  menu?.classList.toggle("active");
});

const menuLinks = document.querySelectorAll("#menu a");

menuLinks.forEach((link) => {
  link.addEventListener("click", () => {
    menuBtn?.classList.remove("active");
    menu?.classList.remove("active");
  });
});

let heroBottom = 0;
let scrollUiTicking = false;
let scrollUiNeedsMeasure = true;
let isDesktopViewport = window.innerWidth >= 769;

function measureScrollUi() {
  isDesktopViewport = window.innerWidth >= 769;
  heroBottom = hero ? hero.offsetTop + hero.offsetHeight : 0;
}

function updateScrollUi() {
  // 量測集中在 rAF 內，一幀最多一次，避免 resize 連發時反覆強制重排。
  if (scrollUiNeedsMeasure) {
    scrollUiNeedsMeasure = false;
    measureScrollUi();
  }

  const scrollY = window.scrollY;
  const isPastHero = heroBottom > 0 && scrollY >= heroBottom;
  const isAnyScroll = scrollY > 0;

  // 沒有 hero 的頁面（例如 contact.html）不套用 header 捲動狀態，
  // 否則桌面導覽列會被 .compact 收成漢堡。
  if (header && hero) {
    header.classList.toggle("scrolled", isPastHero);

    // Keep desktop hero state clean: hide overlay menu when hamburger is hidden.
    if (!isPastHero && isDesktopViewport) {
      menuBtn?.classList.remove("active");
      menu?.classList.remove("active");
    }

    // Desktop nav mode: switch to compact hamburger as soon as user scrolls.
    header.classList.toggle("compact", isDesktopViewport && isAnyScroll);
  }

  if (scrollTopBtn) {
    const threshold = heroBottom > 0 ? heroBottom * 0.6 : 240;
    const shouldShow = !isDesktopViewport && scrollY > threshold;
    scrollTopBtn.classList.toggle("is-visible", shouldShow);
  }
}

function requestScrollUiUpdate() {
  if (scrollUiTicking) return;
  scrollUiTicking = true;
  window.requestAnimationFrame(() => {
    // finally：即使 updateScrollUi 拋錯也要放掉旗標，
    // 否則之後所有捲動更新都會被永久擋住。
    try {
      updateScrollUi();
    } finally {
      scrollUiTicking = false;
    }
  });
}

scrollTopBtn?.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});

window.addEventListener("load", () => {
  scrollUiNeedsMeasure = true;
  updateScrollUi();
});
window.addEventListener("scroll", requestScrollUiUpdate, { passive: true });

// 首次進站若瀏覽器還原了捲動位置，先把狀態算對一次。
// 這裡必須同步執行：在背景分頁開啟時 rAF 會被凍結，
// 用 requestScrollUiUpdate() 會讓旗標卡住、之後完全不更新。
updateScrollUi();

function initMarqueeComponents() {
  const marqueeRoots = document.querySelectorAll(".js-marquee-component");
  if (!marqueeRoots.length) return;

  marqueeRoots.forEach((root) => {
    const text = (root.dataset.marqueeText || "SLBROS").trim() || "SLBROS";
    const iconSrc = (root.dataset.marqueeIcon || "./image/marquee-icon.png").trim();
    const separator = (root.dataset.marqueeSeparator || "").trim();
    const groupCount = Math.max(2, Number.parseInt(root.dataset.marqueeGroups || "2", 10) || 2);
    const repeatCount = Math.max(1, Number.parseInt(root.dataset.marqueeRepeat || "4", 10) || 4);
    const isReverse = root.dataset.marqueeReverse === "true";

    const track = document.createElement("div");
    track.className = "marquee-track";
    if (isReverse) {
      track.classList.add("marquee-track--reverse");
    }

    for (let groupIndex = 0; groupIndex < groupCount; groupIndex += 1) {
      const group = document.createElement("div");
      group.className = "marquee-group";

      for (let i = 0; i < repeatCount; i += 1) {
        const label = document.createElement("span");
        label.className = "marquee-text";
        label.textContent = text;
        group.appendChild(label);

        if (separator) {
          const separatorNode = document.createElement("span");
          separatorNode.className = "marquee-separator";
          separatorNode.textContent = separator;
          group.appendChild(separatorNode);
        } else {
          const icon = document.createElement("img");
          icon.className = "marquee-icon";
          icon.src = iconSrc;
          icon.alt = "";
          icon.loading = "lazy";
          group.appendChild(icon);
        }
      }

      track.appendChild(group);
    }

    root.replaceChildren(track);
  });
}

initMarqueeComponents();

gsap.registerPlugin(ScrollTrigger);

/* =========================
   Stories in Motion：卡片進場、桌機欄位視差、影片進入畫面才播放
========================= */
function initMotionSection() {
  const section = document.querySelector(".motion");
  if (!section) return;

  const cols = Array.from(section.querySelectorAll(".motion__col"));
  const cards = Array.from(section.querySelectorAll(".motion__card"));
  const videos = Array.from(section.querySelectorAll(".motion__video"));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reduceMotion) {
    gsap.from(section.querySelectorAll(".motion__title, .motion__desc"), {
      opacity: 0,
      y: 30,
      duration: 0.8,
      stagger: 0.12,
      ease: "power3.out",
      scrollTrigger: { trigger: section, start: "top 80%", once: true }
    });

    gsap.from(cards, {
      opacity: 0,
      y: 60,
      duration: 0.9,
      stagger: 0.08,
      ease: "power3.out",
      scrollTrigger: { trigger: section.querySelector(".motion__grid"), start: "top 85%", once: true }
    });

    // 桌機才做視差：每欄捲動速度不同，讓錯落感更明顯
    ScrollTrigger.matchMedia({
      "(min-width: 769px)": () => {
        const speeds = [40, -30, 60, -20];
        cols.forEach((col, i) => {
          gsap.fromTo(col, { y: speeds[i] }, {
            y: -speeds[i],
            ease: "none",
            scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true }
          });
        });
      }
    });
  }

  // 影片 preload="none"，進入畫面附近才載入播放，離開就暫停省資源
  if (!videos.length) return;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    if (!reduceMotion) videos.forEach((v) => v.play().catch(() => {}));
    return;
  }

  const inView = new Set();

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) {
        inView.add(target);
        target.play().catch(() => {});
      } else {
        inView.delete(target);
        target.pause();
      }
    });
  }, { rootMargin: "200px 0px" });

  videos.forEach((v) => observer.observe(v));

  // 切到別的分頁時瀏覽器會暫停影片，切回來把畫面內的補播
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) inView.forEach((v) => v.play().catch(() => {}));
  });
}

initMotionSection();

function initStakeOverscrollPin() {
  const stakePanel = document.querySelector(".stake-section");
  if (!stakePanel) return;

  stakePanel.style.marginBottom = "0px";
}

initStakeOverscrollPin();

const stakeSection = document.querySelector(".stake-section");

if (stakeSection) {
  const stakeInner = stakeSection.querySelector(".section-inner") || stakeSection;
  const stakeHead = stakeSection.querySelector(".stake-head");
  const stakeTitle = stakeSection.querySelector(".stake-title");
  const stakeDesc = stakeSection.querySelector(".stake-desc");
  const stakeGoBtn = stakeSection.querySelector(".stake-go-btn");

  gsap.set([stakeTitle, stakeDesc, stakeGoBtn], { opacity: 0, y: 34 });

  const stakeTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: stakeHead || stakeInner,
      start: "top 90%",
      end: "+=220",
      scrub: true,
      invalidateOnRefresh: true
    }
  });

  /* 標題與小字回復整段淡入 */
  stakeTimeline.to(stakeTitle, {
    opacity: 1,
    y: 0,
    ease: "none",
    duration: 0.95
  });

  stakeTimeline.to(stakeDesc, {
    opacity: 1,
    y: 0,
    ease: "none",
    duration: 1.05
  }, 0.14);

  stakeTimeline.to(stakeGoBtn, {
    opacity: 1,
    y: 0,
    ease: "none",
    duration: 0.6
  }, 0.2);

}

/* =========================
   Web3 平台場景：點右側按鈕切換場景圖與文字卡
========================= */
function initWeb3Showcase() {
  const root = document.querySelector("[data-web3-showcase]");
  if (!root) return;

  const tabs = Array.from(root.querySelectorAll("[data-web3-tab]"));
  const scenes = Array.from(root.querySelectorAll("[data-web3-scene]"));
  const panels = Array.from(root.querySelectorAll("[data-web3-panel]"));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 進場：場景框從下方浮上來
  if (!reduceMotion && window.gsap && window.ScrollTrigger) {
    gsap.from(root, {
      opacity: 0,
      y: 60,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: {
        trigger: root,
        start: "top 85%",
        once: true
      }
    });
  }

  // 只剩一個平台時就沒有切換行為了，後面的切換邏輯直接跳過
  if (!tabs.length) return;

  let activeKey = tabs[0].dataset.web3Tab;
  let panelTimeline = null;

  // 場景圖是 lazy 載入，捲到區塊附近時先把其他張也載好，切換時才不會閃黑。
  const preload = () => {
    scenes.forEach((scene) => {
      const img = scene.querySelector("img");
      if (img) img.loading = "eager";
    });
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      preload();
      observer.disconnect();
    }, { rootMargin: "600px 0px" });
    observer.observe(root);
  } else {
    preload();
  }

  const goTo = (key, focusTab) => {
    if (key === activeKey) return;
    activeKey = key;

    tabs.forEach((tab) => {
      const selected = tab.dataset.web3Tab === key;
      tab.classList.toggle("is-active", selected);
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focusTab) tab.focus();
    });

    scenes.forEach((scene) => {
      scene.classList.toggle("is-active", scene.dataset.web3Scene === key);
    });

    const prevPanel = panels.find((panel) => !panel.hidden);
    const nextPanel = panels.find((panel) => panel.dataset.web3Panel === key);

    const showPanel = () => {
      panels.forEach((panel) => {
        const selected = panel === nextPanel;
        panel.hidden = !selected;
        panel.classList.toggle("is-active", selected);
        if (!selected && window.gsap) gsap.set(panel, { clearProps: "transform" });
      });
    };

    // 連續快速點擊時，先停掉上一段動畫並把卡片位置歸零
    if (panelTimeline) panelTimeline.kill();
    if (window.gsap) {
      gsap.set(panels, { clearProps: "transform,opacity" });
    }

    if (reduceMotion || !window.gsap || !prevPanel || !nextPanel || prevPanel === nextPanel) {
      showPanel();
      return;
    }

    // 遊戲機選單感：舊卡片往左滑出，新卡片從場景框右側滑進來、停下時微微回彈
    // 名稱標籤跟介紹卡片是同一個 panel，整塊一起移動，看起來是一體的卡片
    // 位移用整個場景框的寬度，框有 overflow: hidden，卡片會從框外滑進來
    const distance = () => root.offsetWidth;

    panelTimeline = gsap.timeline()
      .to(prevPanel, {
        x: () => -distance(),
        duration: 0.45,
        ease: "power2.in"
      })
      .add(showPanel)
      .fromTo(nextPanel, { x: distance }, {
        x: 0,
        duration: 0.9,
        ease: "back.out(1.2)"
      });
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => goTo(tab.dataset.web3Tab));

    // tablist 鍵盤操作：上下左右切換
    tab.addEventListener("keydown", (event) => {
      const offset = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
      if (!offset) return;
      event.preventDefault();
      const next = tabs[(index + offset + tabs.length) % tabs.length];
      goTo(next.dataset.web3Tab, true);
    });
  });

}

initWeb3Showcase();

/* 只在 viewport 寬度改變時刷新，避免手機網址列伸縮造成跳動。 */
let lastViewportWidth = window.innerWidth;
let resizeRefreshTimer;

window.addEventListener("resize", () => {
  const nextWidth = window.innerWidth;
  scrollUiNeedsMeasure = true;
  requestScrollUiUpdate();

  if (nextWidth === lastViewportWidth) return;
  lastViewportWidth = nextWidth;
  window.clearTimeout(resizeRefreshTimer);
  resizeRefreshTimer = window.setTimeout(() => {
    ScrollTrigger.refresh();
  }, 250);
}, { passive: true });

/*stake section 滑鼠跟隨發光效果*/
document.querySelectorAll(".stake-card").forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const inner = card.querySelector(".stake-card-inner");
    if (!inner) return;

    const rect = inner.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    inner.style.setProperty("--x", `${x}px`);
    inner.style.setProperty("--y", `${y}px`);
  });

  card.addEventListener("mouseleave", () => {
    const inner = card.querySelector(".stake-card-inner");
    if (!inner) return;

    inner.style.setProperty("--x", `50%`);
    inner.style.setProperty("--y", `50%`);
  });
});

/* =========================
   Poker Section Scroll Reveal
========================= */
function initPokerScrollReveal() {
  const pokerSection = document.getElementById("poker");
  if (!pokerSection) return;

  const pokerHead = pokerSection.querySelector(".poker__head");
  const pokerTitle = pokerSection.querySelector(".poker__title");
  const pokerIcon = pokerHead?.querySelector(".poker__toggle img");
  const pokerItems = gsap.utils.toArray(".poker__item", pokerSection);

  if (!pokerTitle || !pokerItems.length) return;

  // 初始化元素狀態
  gsap.set(pokerTitle, { opacity: 0, y: 40 });
  gsap.set(pokerIcon, { opacity: 0, scale: 0.8, rotationZ: 0 });
  gsap.set(pokerItems, { opacity: 0, y: 30 });

  // 先讓標題與 icon 在進入區塊時出現
  gsap.timeline({
    scrollTrigger: {
      trigger: pokerSection,
      start: "top 80%",
      toggleActions: "play none none reverse",
      invalidateOnRefresh: true
    }
  })
    .to(
      pokerTitle,
      {
        opacity: 1,
        y: 0,
        ease: "power2.out",
        duration: 0.6
      },
      0
    )
    .to(
      pokerIcon,
      {
        opacity: 1,
        scale: 1,
        ease: "power2.out",
        duration: 0.5
      },
      0.1
    );

  // 每張卡片各自觸發：滾到哪張就淡入哪張
  pokerItems.forEach((item) => {
    gsap.to(item, {
      opacity: 1,
      y: 0,
      ease: "power2.out",
      duration: 0.55,
      scrollTrigger: {
        trigger: item,
        start: "top 86%",
        toggleActions: "play none none reverse",
        invalidateOnRefresh: true
      }
    });
  });

  // Icon 持續旋轉（貫穿整個滾動過程）
  gsap.to(pokerIcon, {
    rotationZ: 360,
    duration: 8,
    repeat: -1,
    ease: "linear"
  });
}

initPokerScrollReveal();

/* =========================
   Adventure Content Storyboard
========================= */
function initAdventureStoryboard() {
  const section = document.getElementById("adventure");
  if (!section) return;

  const lines = gsap.utils.toArray(".adventure__line");
  const leftIcons = gsap.utils.toArray(".adventure__rail--left .adventure__icon");
  const rightIcons = gsap.utils.toArray(".adventure__rail--right .adventure__icon");

  if (!lines.length) return;

  const isDesktop = window.matchMedia("(min-width: 769px)").matches;

  // 整句淡入＋往上浮，跟「關於晴天兄弟」一樣一句一句出現
  gsap.set(lines, {
    opacity: 0,
    y: 26,
    force3D: true
  });

  if (isDesktop) {
    const leftPhases = [
      [
        { x: -20,  y: -250, rotate: -18, scale: 1.00, opacity: 1.00 },
        { x: 70,   y: 130,  rotate: 10,  scale: 0.90, opacity: 0.95 },
        { x: -120, y: 320,  rotate: -10, scale: 0.86, opacity: 0.00 },
        { x: 30,   y: 520,  rotate: 12,  scale: 0.90, opacity: 0.00 },
        { x: -40,  y: 730,  rotate: -8,  scale: 0.95, opacity: 0.00 }
      ],
      [
        { x: -70,  y: -360, rotate: -20, scale: 0.95, opacity: 0.40 },
        { x: 10,   y: -40,  rotate: 14,  scale: 1.00, opacity: 1.00 },
        { x: -80,  y: 250,  rotate: -6,  scale: 0.92, opacity: 0.95 },
        { x: 30,   y: 500,  rotate: 8,   scale: 0.88, opacity: 0.00 },
        { x: -30,  y: 760,  rotate: -8,  scale: 0.90, opacity: 0.00 }
      ],
      [
        { x: -120, y: -460, rotate: -18, scale: 0.88, opacity: 0.00 },
        { x: 10,   y: -180, rotate: 12,  scale: 0.92, opacity: 0.45 },
        { x: -30,  y: 60,   rotate: -8,  scale: 1.00, opacity: 1.00 },
        { x: 50,   y: 350,  rotate: 12,  scale: 0.90, opacity: 0.95 },
        { x: -40,  y: 620,  rotate: -8,  scale: 0.84, opacity: 0.00 }
      ],
      [
        { x: -120, y: -560, rotate: -16, scale: 0.86, opacity: 0.00 },
        { x: 20,   y: -320, rotate: 8,   scale: 0.88, opacity: 0.00 },
        { x: -40,  y: -60,  rotate: -8,  scale: 0.92, opacity: 0.40 },
        { x: 30,   y: 140,  rotate: 10,  scale: 1.00, opacity: 1.00 },
        { x: -20,  y: 430,  rotate: -10, scale: 0.92, opacity: 0.95 }
      ],
      [
        { x: -140, y: -700, rotate: -14, scale: 0.84, opacity: 0.00 },
        { x: 0,    y: -420, rotate: 8,   scale: 0.86, opacity: 0.00 },
        { x: -50,  y: -180, rotate: -8,  scale: 0.88, opacity: 0.00 },
        { x: 20,   y: 60,   rotate: 8,   scale: 0.90, opacity: 0.45 },
        { x: -10,  y: 220,  rotate: -8,  scale: 1.00, opacity: 1.00 }
      ]
    ];

    const rightPhases = [
      [
        { x: 40,  y: 180,  rotate: 16,  scale: 1.00, opacity: 1.00 },
        { x: -40, y: -220, rotate: -10, scale: 0.00, opacity: 0.00 },
        { x: 60,  y: 420,  rotate: 10,  scale: 0.00, opacity: 0.00 },
        { x: -20, y: 620,  rotate: -8,  scale: 0.00, opacity: 0.00 },
        { x: 20,  y: -420, rotate: 8,   scale: 0.00, opacity: 0.00 }
      ],
      [
        { x: 80,  y: 320,  rotate: 18,  scale: 0.92, opacity: 0.50 },
        { x: -10, y: -80,  rotate: -10, scale: 1.00, opacity: 1.00 },
        { x: 60,  y: 300,  rotate: 8,   scale: 0.92, opacity: 0.95 },
        { x: -20, y: 610,  rotate: -8,  scale: 0.00, opacity: 0.00 },
        { x: 20,  y: -500, rotate: 8,   scale: 0.00, opacity: 0.00 }
      ],
      [
        { x: 80,  y: 500,  rotate: 18,  scale: 0.84, opacity: 0.00 },
        { x: -20, y: -210, rotate: -10, scale: 0.92, opacity: 0.45 },
        { x: 30,  y: 80,   rotate: 10,  scale: 1.00, opacity: 1.00 },
        { x: -20, y: 400,  rotate: -8,  scale: 0.92, opacity: 0.95 },
        { x: 20,  y: -560, rotate: 8,   scale: 0.00, opacity: 0.00 }
      ],
      [
        { x: 90,  y: 620,  rotate: 16,  scale: 0.00, opacity: 0.00 },
        { x: -30, y: -360, rotate: -10, scale: 0.00, opacity: 0.00 },
        { x: 30,  y: -80,  rotate: 8,   scale: 0.90, opacity: 0.45 },
        { x: -10, y: 140,  rotate: -8,  scale: 1.00, opacity: 1.00 },
        { x: 40,  y: -220, rotate: 10,  scale: 0.92, opacity: 0.95 }
      ],
      [
        { x: 100, y: 720,  rotate: 16,  scale: 0.00, opacity: 0.00 },
        { x: -40, y: -520, rotate: -12, scale: 0.00, opacity: 0.00 },
        { x: 20,  y: -220, rotate: 8,   scale: 0.00, opacity: 0.00 },
        { x: -20, y: 0,    rotate: -8,  scale: 0.92, opacity: 0.45 },
        { x: 10,  y: 180,  rotate: 10,  scale: 1.00, opacity: 1.00 }
      ]
    ];

    // 每張 icon 的個別位置微調（單位：px）。
    // 你之後只要改這裡，就能分別調整 01~10 的位置，不必逐段改 phase。
    const adventureIconOffsets = {
      "01": { x: -150, y:-20 },
      "02": { x: 30, y: -10 },
      "03": { x: -20, y: 120 },
      "04": { x: 250, y: -50 },
      "05": { x: -250, y: 150 },
      "06": { x:300, y: -650 },
      "07": { x: -400, y: -720 },
      "08": { x: 180, y: -100 },
      "09": { x: 90, y: -90 },
      "10": { x: -100, y: 10 }
    };

    // 每張 icon 的尺寸倍率（以 phase 裡的 scale 為基礎再乘上此倍率）
    const adventureIconScaleMultiplier = {
      "01": 1,
      "02": 0.9,
      "03": 2.3,
      "04": 1,
      "05": 1,
      "06": 1,
      "07": 0.5,
      "08": 0.6,
      "09": 0.9,
      "10": 1.4
    };

    const getOffsetScale = () => {
      const width = window.innerWidth;
      if (width >= 1600) return 1;
      if (width >= 1300) return 0.9;
      if (width >= 1100) return 0.78;
      return 0.62; // 769~1099
    };

    const getIconKey = (icon) => {
      const nameClass = Array.from(icon.classList).find((cls) => cls.startsWith("adventure__icon--"));
      if (!nameClass) return null;
      return nameClass.replace("adventure__icon--", "");
    };

    const getIconOffset = (icon) => {
      const key = getIconKey(icon);
      if (!key) return { x: 0, y: 0 };
      const base = adventureIconOffsets[key] || { x: 0, y: 0 };
      const ratio = getOffsetScale();
      return {
        x: Math.round(base.x * ratio),
        y: Math.round(base.y * ratio)
      };
    };

    const getIconScaleMultiplier = (icon) => {
      const key = getIconKey(icon);
      if (!key) return 1;
      return adventureIconScaleMultiplier[key] ?? 1;
    };

    leftIcons.forEach((icon, idx) => {
      const state = leftPhases[0][idx];
      if (!state) return;
      const offset = getIconOffset(icon);
      const scaleMultiplier = getIconScaleMultiplier(icon);
      gsap.set(icon, {
        xPercent: -50,
        yPercent: -50,
        x: state.x + offset.x,
        y: state.y + offset.y,
        rotation: state.rotate,
        scale: state.scale * scaleMultiplier,
        opacity: state.opacity
      });
    });

    rightIcons.forEach((icon, idx) => {
      const state = rightPhases[0][idx];
      if (!state) return;
      const offset = getIconOffset(icon);
      const scaleMultiplier = getIconScaleMultiplier(icon);
      gsap.set(icon, {
        xPercent: -50,
        yPercent: -50,
        x: state.x + offset.x,
        y: state.y + offset.y,
        rotation: state.rotate,
        scale: state.scale * scaleMultiplier,
        opacity: state.opacity
      });
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "+=4200",
        pin: true,
        pinSpacing: true,
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });

    lines.forEach((line, i) => {
      // 文字：整句進場
      tl.to(line, {
        opacity: 1,
        y: 0,
        duration: 0.45,
        ease: "none"
      });

      // icon 換位（逐個 icon 設定，避免 vars 傳入陣列）
      leftIcons.forEach((icon, idx) => {
        const state = leftPhases[i][idx];
        if (!state) return;
        const offset = getIconOffset(icon);
        const scaleMultiplier = getIconScaleMultiplier(icon);
        tl.to(icon, {
          x: state.x + offset.x,
          y: state.y + offset.y,
          rotation: state.rotate,
          scale: state.scale * scaleMultiplier,
          opacity: state.opacity,
          duration: 0.45,
          ease: "none"
        }, "<");
      });

      rightIcons.forEach((icon, idx) => {
        const state = rightPhases[i][idx];
        if (!state) return;
        const offset = getIconOffset(icon);
        const scaleMultiplier = getIconScaleMultiplier(icon);
        tl.to(icon, {
          x: state.x + offset.x,
          y: state.y + offset.y,
          rotation: state.rotate,
          scale: state.scale * scaleMultiplier,
          opacity: state.opacity,
          duration: 0.45,
          ease: "none"
        }, "<");
      });

      // 停留
      tl.to({}, { duration: 0.35 });

      // 退場（整句淡出往上；最後一句留到收尾）
      if (i !== lines.length - 1) {
        tl.to(line, {
          opacity: 0,
          y: -26,
          duration: 0.35,
          ease: "none"
        });
      }
    });

    // 收尾時把最後一句也退場，避免區塊結束後殘留一行字。
    tl.to(lines[lines.length - 1], {
      opacity: 0,
      y: -26,
      duration: 0.35,
      ease: "none"
    });
  } else {
    // mobile 簡化版：只做句子切換
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "+=2600",
        pin: true,
        pinSpacing: true,
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });

    lines.forEach((line, i) => {
      tl.to(line, {
        opacity: 1,
        y: 0,
        duration: 0.45,
        ease: "none"
      });

      tl.to({}, { duration: 0.35 });

      if (i !== lines.length - 1) {
        tl.to(line, {
          opacity: 0,
          y: -26,
          duration: 0.35,
          ease: "none"
        });
      }
    });

    // Mobile 收尾同樣退掉最後一句，避免離開區塊時重複顯示。
    tl.to(lines[lines.length - 1], {
      opacity: 0,
      y: -26,
      duration: 0.35,
      ease: "none"
    });
  }
}

initAdventureStoryboard();

const ctaSection = document.querySelector(".cta-section");

if (ctaSection) {
  gsap.set(".cta-title", { opacity: 0, y: 30 });
  gsap.set(".cta-copy", { opacity: 0, y: 24 });
  gsap.set(".cta-btn", { opacity: 0, y: 20 });

  const ctaTl = gsap.timeline({
    scrollTrigger: {
      trigger: ".cta-section",
      start: "top 80%",
      toggleActions: "play none none reverse"
    }
  });

  ctaTl.to(".cta-title", {
    opacity: 1,
    y: 0,
    duration: 0.6,
    ease: "power3.out"
  });

  ctaTl.to(".cta-copy", {
    opacity: 1,
    y: 0,
    duration: 0.6,
    stagger: 0.12,
    ease: "power3.out"
  }, "-=0.25");

  ctaTl.to(".cta-btn", {
    opacity: 1,
    y: 0,
    duration: 0.5,
    stagger: 0.12,
    ease: "power3.out"
  }, "-=0.2");
}

// ── Footer BG Text Split on Scroll ──────────────────────────────
const siteFooter = document.querySelector('.site-footer');
const footerTopLine = siteFooter?.querySelector('.footer-top-line');
const footerContent = siteFooter?.querySelector('.footer-content');

if (siteFooter) {
  gsap.set(footerTopLine, { scaleX: 0, transformOrigin: 'left center' });
  gsap.set(footerContent, { opacity: 0, y: 32 });

  gsap.timeline({
    scrollTrigger: {
      trigger: siteFooter,
      start: 'top 82%',
      toggleActions: 'play none none none',
      onEnter: () => siteFooter.classList.add('is-visible')
    }
  })
    .to(footerTopLine, {
      scaleX: 1,
      duration: 0.5,
      ease: 'power2.out'
    })
    .to(footerContent, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out'
    }, '-=0.2');
}

const footerBgEl = document.querySelector('.footer-bg-text');
if (footerBgEl) {
  const chars = footerBgEl.textContent.trim().split('');
  footerBgEl.innerHTML = chars
    .map(c => `<span class="fbc">${c}</span>`)
    .join('');

  gsap.set('.fbc', {
    y: 60,
    opacity: 0
  });

  gsap.to('.fbc', {
    y: 0,
    opacity: 1,
    duration: 0.8,
    stagger: 0.07,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.site-footer',
      start: 'top 82%',
      toggleActions: 'play none none none'
    }
  });
}

// ── Custom Cursor ───────────────────────────────────────────────
const customCursor = document.querySelector(".custom-cursor");
const rootEl = document.documentElement;

if (window.matchMedia("(min-width: 769px)").matches && customCursor) {
  const customCursorImgs = customCursor.querySelectorAll("img");

  if (customCursorImgs.length) {
    rootEl.classList.add("cursor-ready");

    const clickableSelector = [
      "a",
      "button",
      "[role='button']",
      "input[type='submit']",
      "input[type='button']"
    ].join(",");

    let targetScale = 1;
    let targetRotate = 0;

    let isHover = false;
    let isDown = false;
    let isCursorVisible = true;

    const setCursorX = gsap.quickSetter(customCursor, "x", "px");
    const setCursorY = gsap.quickSetter(customCursor, "y", "px");

    function showCursor() {
      if (isCursorVisible) return;
      isCursorVisible = true;
      gsap.to(customCursor, {
        opacity: 1,
        duration: 0.2,
        ease: "power2.out",
        overwrite: true
      });
    }

    gsap.set(customCursor, {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      xPercent: -16,
      yPercent: -16,
      opacity: 1
    });

    window.addEventListener("mousemove", (e) => {
      setCursorX(e.clientX);
      setCursorY(e.clientY);
      showCursor();
    }, { passive: true });

    window.addEventListener("mousedown", () => {
      isDown = true;
      updateCursorState(true);
    });

    window.addEventListener("mouseup", () => {
      isDown = false;
      updateCursorState(true);
    });

    document.addEventListener("mouseleave", () => {
      isCursorVisible = false;
      gsap.to(customCursor, {
        opacity: 0,
        duration: 0.2,
        ease: "power2.out",
        overwrite: true
      });
    });

    document.addEventListener("mouseenter", () => {
      showCursor();
    });

    function updateCursorState(animated = false) {
      if (isDown) {
        targetScale = 0.92;
      } else if (isHover) {
        targetScale = 1.18;
      } else {
        targetScale = 1;
      }

      targetRotate = 0;

      customCursor.classList.toggle("is-hover", isHover);

      gsap.to(customCursorImgs, {
        scale: targetScale,
        rotation: targetRotate,
        duration: animated ? 0.16 : 0,
        ease: "power2.out",
        overwrite: true
      });
    }

    const clickableElements = document.querySelectorAll(clickableSelector);
    clickableElements.forEach((el) => {
      el.addEventListener("mouseenter", () => {
        isHover = true;
        updateCursorState(true);
      });

      el.addEventListener("mouseleave", () => {
        isHover = false;
        updateCursorState(true);
      });
    });
  }
} else {
  rootEl.classList.remove("cursor-ready");
}
