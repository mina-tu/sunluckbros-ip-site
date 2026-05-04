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

window.addEventListener("load", () => {
  toggleNavbarGlass();
});

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

function toggleNavbarGlass() {
  if (!header || !hero) return;

  const heroBottom = hero.offsetTop + hero.offsetHeight;
  const triggerPoint = heroBottom;
  const isPastHero = window.scrollY >= triggerPoint;
  const isDesktop = window.matchMedia("(min-width: 769px)").matches;
  const isAnyScroll = window.scrollY > 0;

  if (isPastHero) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");

    // Keep desktop hero state clean: hide overlay menu when hamburger is hidden.
    if (isDesktop) {
      menuBtn?.classList.remove("active");
      menu?.classList.remove("active");
    }
  }

  // Desktop nav mode: switch to compact hamburger as soon as user scrolls.
  if (isDesktop && isAnyScroll) {
    header.classList.add("compact");
  } else {
    header.classList.remove("compact");
  }
}

window.addEventListener("scroll", toggleNavbarGlass);
window.addEventListener("resize", toggleNavbarGlass);

function toggleScrollTopButton() {
  if (!scrollTopBtn) return;

  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const threshold = hero ? hero.offsetHeight * 0.6 : 240;
  const shouldShow = isMobile && window.scrollY > threshold;

  scrollTopBtn.classList.toggle("is-visible", shouldShow);
}

scrollTopBtn?.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});

window.addEventListener("load", toggleScrollTopButton);
window.addEventListener("scroll", toggleScrollTopButton);
window.addEventListener("resize", toggleScrollTopButton);

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

console.log("GSAP:", typeof gsap, "ScrollTrigger:", typeof ScrollTrigger);

const aboutTrack = document.querySelector(".about-track");
const aboutPanel1Label = document.querySelector(".panel1-label");
const aboutPanel1Intro = document.querySelector(".panel1-intro");
const aboutPanel1RevealChars = document.querySelectorAll(".panel1-reveal span");
const aboutPanel1Text = document.querySelector(".panel1-text");

const isDesktopViewport = window.matchMedia("(min-width: 769px)").matches;

if (isDesktopViewport && aboutPanel1Label && aboutPanel1Intro && aboutPanel1RevealChars.length && aboutPanel1Text) {
  gsap.set(".panel1-label", { opacity: 0, y: 18 });
  gsap.set(".panel1-intro", { opacity: 0, y: 22 });
  gsap.set(".panel1-reveal span", { opacity: 0, y: 18 });
  gsap.set(".panel2-text .copy-line", { opacity: 0, y: 24 });
  gsap.set(".panel3-text .copy-line", { opacity: 0, y: 24 });
}

ScrollTrigger.matchMedia({
  "(min-width: 769px)": function () {
    if (!aboutTrack || !aboutPanel1Label || !aboutPanel1Intro || !aboutPanel1RevealChars.length || !aboutPanel1Text) return;

    gsap.set(".about-track", { clearProps: "transform" });
    gsap.set(".panel1-text", { clearProps: "x,y" });

    const aboutTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: ".about-section",
        start: "top top",
        end: () => "+=" + window.innerWidth * 2.15,
        scrub: true,
        pin: true,
        anticipatePin: 1
      }
    });

    aboutTimeline.to(".panel1-label", {
      opacity: 1,
      y: 0,
      ease: "none",
      duration: 0.12
    }, 0);

    aboutTimeline.to(".panel1-intro", {
      opacity: 1,
      y: 0,
      ease: "none",
      duration: 0.15
    }, 0.03);

    aboutTimeline.to(".panel1-reveal span", {
      opacity: 1,
      y: 0,
      stagger: 0.002,
      ease: "none",
      duration: 0.2
    }, 0.08);

    aboutTimeline.to(".panel1-text", {
      x: -90,
      y: -24,
      ease: "none",
      duration: 0.2
    }, 0.3);

    aboutTimeline.addLabel("panel2Start", 0.36);

    aboutTimeline.to(".about-track", {
      x: () => -window.innerWidth,
      ease: "none",
      duration: 0.34
    }, "panel2Start");

    aboutTimeline.to(".panel2-text .copy-line", {
      opacity: 1,
      y: 0,
      stagger: 0.035,
      ease: "none",
      duration: 0.1
    }, "panel2Start+=0.04");

    aboutTimeline.addLabel("panel3Start", 0.72);

    aboutTimeline.to(".about-track", {
      x: () => -(window.innerWidth * 2),
      ease: "none",
      duration: 0.3
    }, "panel3Start");

    aboutTimeline.to(".panel3-text .copy-line", {
      opacity: 1,
      y: 0,
      stagger: 0.1,
      ease: "none",
      duration: 0.14
    }, "panel3Start+=0.08");
  },

  "(max-width: 768px)": function () {
    gsap.set(".about-track", { clearProps: "transform" });
    gsap.set(".panel1-text", { clearProps: "x,y,transform" });
    gsap.set(".panel1-label", { clearProps: "x,y,transform" });
    gsap.set(".panel1-intro", { clearProps: "x,y,transform" });
    gsap.set(".panel1-reveal span", { clearProps: "x,y,transform" });

    gsap.set(".panel1-label", { opacity: 1 });
    gsap.set(".panel1-intro", { opacity: 1 });
    gsap.set(".panel1-reveal span", { opacity: 1 });
    gsap.set(".panel2-text .copy-line", { opacity: 1, clearProps: "y,transform" });
    gsap.set(".panel3-text .copy-line", { opacity: 1, clearProps: "y,transform" });
  }
});

function initAboutStarsParallax() {
  const section = document.querySelector(".about");
  const track = document.querySelector(".about-track");
  const star2 = document.querySelector(".star-2");
  const star3 = document.querySelector(".star-3");

  if (!section || !track) return;

  const getEndDistance = () => track.scrollWidth - window.innerWidth;

  if (star2) {
    gsap.to(star2, {
      x: 300,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => "+=" + getEndDistance(),
        scrub: 1,
        invalidateOnRefresh: true
      }
    });
  }

  if (star3) {
    gsap.to(star3, {
      x: -150,
      rotation: 360,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => "+=" + getEndDistance(),
        scrub: 1,
        invalidateOnRefresh: true
      }
    });
  }
}

initAboutStarsParallax();

function initAboutMouseParallax() {
  if (!window.matchMedia("(min-width: 769px)").matches) return;
  const configs = [
    {
      panelSelector: ".panel-1",
      bgSelector: ".panel1-mouse-bg",
      textSelector: ".panel1-text"
    },
    {
      panelSelector: ".panel-2",
      bgSelector: ".panel2-mouse-bg",
      textSelector: null
    },
    {
      panelSelector: ".panel-3",
      bgSelector: ".panel3-mouse-bg",
      textSelector: ".panel3-text"
    }
  ];

  configs.forEach(({ panelSelector, bgSelector, textSelector }) => {
    const panel = document.querySelector(panelSelector);
    const bg = document.querySelector(bgSelector);
    const text = textSelector ? document.querySelector(textSelector) : null;

    if (!panel || !bg) return;

    const moveBgX = gsap.quickTo(bg, "x", {
      duration: 0.9,
      ease: "power3.out"
    });

    const moveBgY = gsap.quickTo(bg, "y", {
      duration: 0.9,
      ease: "power3.out"
    });

    const moveTextX = text
      ? gsap.quickTo(text, "x", { duration: 0.9, ease: "power3.out" })
      : null;

    const moveTextY = text
      ? gsap.quickTo(text, "y", { duration: 0.9, ease: "power3.out" })
      : null;

    gsap.set(panel, { perspective: 900 });

    panel.addEventListener("pointermove", (e) => {
      const rect = panel.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width;
      const relY = (e.clientY - rect.top) / rect.height;

      const x = gsap.utils.mapRange(0, 1, -30, 30, relX);
      const y = gsap.utils.mapRange(0, 1, -30, 30, relY);

      moveBgX(x);
      moveBgY(y);

      if (moveTextX && moveTextY) {
        moveTextX(-x * 0.18);
        moveTextY(-y * 0.18);
      }
    });

    panel.addEventListener("pointerleave", () => {
      moveBgX(0);
      moveBgY(0);

      if (moveTextX && moveTextY) {
        moveTextX(0);
        moveTextY(0);
      }
    });
  });
}

initAboutMouseParallax();

function initBrandPinScroll() {
  const brandSection = document.querySelector(".brand");
  const brandContent = brandSection?.querySelector(".brand__content");
  const brandCard = brandSection?.querySelector(".brand__card");
  const stakeSection = document.querySelector(".stake-section");

  if (!brandSection || !brandContent || !brandCard || !stakeSection) return;

  const bottomGap = 10;
  const minTop = 24;
  const stakeGap = 40;

  const getDynamicCardY = () => {
    const contentHeight = brandContent.offsetHeight;
    const cardHeight = brandCard.offsetHeight;
    const currentTop = contentHeight - bottomGap - cardHeight;

    const stakeTop = stakeSection.getBoundingClientRect().top;
    const contentTop = brandContent.getBoundingClientRect().top;

    // Keep a stable spacing from stake top until card reaches minTop.
    const desiredTop = Math.max(minTop, stakeTop - stakeGap - cardHeight);
    return desiredTop - (contentTop + currentTop);
  };

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: brandSection,
      start: "top top",
      end: () => "+=" + window.innerHeight * 1.3,
      scrub: true,
      pin: true,
      pinSpacing: false,
      anticipatePin: 1,
      invalidateOnRefresh: true
    }
  });

  tl.to({}, {
    duration: 0.7,
    ease: "none",
    onUpdate: () => {
      gsap.set(brandCard, { y: getDynamicCardY() });
    }
  });

  tl.to(brandSection, {
    scale: 0.86,
    opacity: 0.45,
    ease: "none",
    duration: 0.22
  });

  tl.to(brandSection, {
    opacity: 0,
    ease: "none",
    duration: 0.08
  });
}

initBrandPinScroll();

function initStakeOverscrollPin() {
  const stakePanel = document.querySelector(".stake-section");
  if (!stakePanel) return;

  // Remove synthetic spacing so stake follows brand transition immediately.
  stakePanel.style.marginBottom = "0px";
}

initStakeOverscrollPin();

const stakeSection = document.querySelector(".stake-section");

if (stakeSection) {
  const stakeInner = stakeSection.querySelector(".section-inner") || stakeSection;
  const stakeHead = stakeSection.querySelector(".stake-head");
  const stakeCardsWrap = stakeSection.querySelector(".stake-cards");
  const stakeTitle = stakeSection.querySelector(".stake-title");
  const stakeDesc = stakeSection.querySelector(".stake-desc");
  const stakeGoBtn = stakeSection.querySelector(".stake-go-btn");
  const stakeCards = gsap.utils.toArray(".stake-card", stakeSection);

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

  const stakeCardsTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: stakeCardsWrap || stakeInner,
      start: "top 86%",
      end: "+=260",
      scrub: true,
      invalidateOnRefresh: true
    }
  });

  if (window.matchMedia("(min-width: 1101px)").matches && stakeCards.length === 3) {
    const getCardsLayout = () => {
      const cardWidth = stakeCards[0].offsetWidth;
      const gap = 34;
      const leftStart = stakeCardsWrap
        ? Math.max(0, Math.min(16, stakeCardsWrap.clientWidth * 0.02))
        : 0;

      return { cardWidth, gap, leftStart };
    };

    gsap.set(stakeCards, {
      x: () => getCardsLayout().leftStart,
      y: (i) => i * 3,
      scale: (i) => 1 - i * 0.02,
      zIndex: (i) => 20 - i
    });

    stakeCardsTimeline.to(stakeCards, {
      x: (i) => {
        const { cardWidth, gap, leftStart } = getCardsLayout();
        return leftStart + i * (cardWidth + gap);
      },
      y: 0,
      scale: 1,
      ease: "none",
      duration: 1,
      stagger: 0.08
    });
  } else {
    gsap.set(stakeCards, { opacity: 0, y: 36 });

    stakeCardsTimeline.to(stakeCards, {
      opacity: 1,
      y: 0,
      ease: "none",
      duration: 0.55,
      stagger: 0.12
    });
  }
}

/* resize 時刷新 */
window.addEventListener("resize", () => {
  ScrollTrigger.refresh();
});

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

  const lineChars = lines.map((line) => {
    const rawText = line.textContent || "";
    const chars = Array.from(rawText);

    line.innerHTML = chars
      .map((char) => `<span class="adventure__char">${char === " " ? "&nbsp;" : char}</span>`)
      .join("");

    return gsap.utils.toArray(".adventure__char", line);
  });

  const allChars = lineChars.flat();

  const isDesktop = window.matchMedia("(min-width: 769px)").matches;

  gsap.set(lines, {
    opacity: 0,
    y: 40,
    scale: 0.98,
    filter: "blur(8px)"
  });

  gsap.set(allChars, {
    opacity: 0,
    y: 18
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
      const chars = lineChars[i] || [];

      // 文字：進場
      tl.to(line, {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.2,
        ease: "none"
      });

      tl.to(chars, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.028,
        ease: "none"
      }, "<");

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

      // 退場（最後一句不退）
      if (i !== lines.length - 1) {
        tl.to(chars, {
          opacity: 0,
          y: -12,
          duration: 0.2,
          stagger: {
            each: 0.016,
            from: "end"
          },
          ease: "none"
        });

        tl.to(line, {
          opacity: 0,
          y: -30,
          scale: 1.02,
          filter: "blur(8px)",
          duration: 0.35,
          ease: "none"
        });
      }
    });

    // 收尾時把最後一句也退場，避免區塊結束後殘留一行字。
    tl.to(lineChars[lines.length - 1], {
      opacity: 0,
      y: -12,
      duration: 0.2,
      stagger: {
        each: 0.016,
        from: "end"
      },
      ease: "none"
    });

    tl.to(lines[lines.length - 1], {
      opacity: 0,
      y: -30,
      scale: 1.02,
      filter: "blur(8px)",
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
      const chars = lineChars[i] || [];

      tl.to(line, {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.2,
        ease: "none"
      });

      tl.to(chars, {
        opacity: 1,
        y: 0,
        duration: 0.38,
        stagger: 0.03,
        ease: "none"
      }, "<");

      tl.to({}, { duration: 0.35 });

      if (i !== lines.length - 1) {
        tl.to(chars, {
          opacity: 0,
          y: -10,
          duration: 0.18,
          stagger: {
            each: 0.016,
            from: "end"
          },
          ease: "none"
        });

        tl.to(line, {
          opacity: 0,
          y: -24,
          scale: 1.02,
          filter: "blur(8px)",
          duration: 0.35,
          ease: "none"
        });
      }
    });

    // Mobile 收尾同樣退掉最後一句，避免離開區塊時重複顯示。
    tl.to(lineChars[lines.length - 1], {
      opacity: 0,
      y: -10,
      duration: 0.18,
      stagger: {
        each: 0.016,
        from: "end"
      },
      ease: "none"
    });

    tl.to(lines[lines.length - 1], {
      opacity: 0,
      y: -24,
      scale: 1.02,
      filter: "blur(8px)",
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
      toggleActions: 'play none none reverse'
    }
  });
}

// ── Custom Cursor ───────────────────────────────────────────────
const customCursor = document.querySelector(".custom-cursor");
const rootEl = document.documentElement;

if (window.matchMedia("(min-width: 769px)").matches && customCursor) {
  const customCursorImg = customCursor.querySelector("img");

  if (customCursorImg) {
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

    gsap.set(customCursor, {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      xPercent: -16,
      yPercent: -16,
      opacity: 1
    });

    window.addEventListener("mousemove", (e) => {
      gsap.set(customCursor, {
        x: e.clientX,
        y: e.clientY
      });

      gsap.to(customCursor, {
        opacity: 1,
        duration: 0.2,
        ease: "power2.out"
      });
    });

    window.addEventListener("mousedown", () => {
      isDown = true;
      updateCursorState(true);
    });

    window.addEventListener("mouseup", () => {
      isDown = false;
      updateCursorState(true);
    });

    document.addEventListener("mouseleave", () => {
      gsap.to(customCursor, {
        opacity: 0,
        duration: 0.2,
        ease: "power2.out"
      });
    });

    document.addEventListener("mouseenter", () => {
      gsap.to(customCursor, {
        opacity: 1,
        duration: 0.2,
        ease: "power2.out"
      });
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

      gsap.to(customCursorImg, {
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