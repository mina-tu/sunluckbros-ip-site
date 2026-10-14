(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 角色狀態卡：經驗條跑滿 → LEVEL UP
  const card = document.querySelector(".status-card");
  if (card) {
    const fill = card.querySelector("[data-xp]");
    const lv = card.querySelector("[data-lv]");
    const xpText = card.querySelector("[data-xp-text]");
    const levelUp = () => {
      card.classList.add("is-max");
      if (lv) lv.textContent = "99";
      if (xpText) xpText.textContent = "MAX";
    };
    if (reduceMotion) {
      fill.style.width = "100%";
      levelUp();
    } else {
      setTimeout(() => { fill.style.width = "100%"; }, 500);
      fill.addEventListener("transitionend", levelUp, { once: true });
    }
  }

  // 捲動進場
  const items = document.querySelectorAll(".guild .reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const siblings = [...entry.target.parentElement.children];
        entry.target.style.transitionDelay = `${Math.min(siblings.indexOf(entry.target), 6) * 70}ms`;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15 });
    items.forEach((el) => io.observe(el));
  }

  // 申請流程：角色從 START 一格一格走到 GOAL
  const road = document.querySelector("[data-road]");
  if (road) {
    const viewport = road.querySelector("[data-road-viewport]");
    const hero = road.querySelector("[data-road-hero]");
    const track = hero.parentElement;
    const stops = [...road.querySelectorAll("[data-stop]")];
    const cards = stops.filter((el) => el.classList.contains("road-card"));
    const status = road.querySelector("[data-road-status]");
    const replay = road.querySelector("[data-road-replay]");
    const SPEED = 260; // px / 秒
    let at = 0;
    let runId = 0;

    // 角色組比起點／終點格寬，夾在軌道內避免超出畫面
    // 終點：停在旗桿左邊，旗子才不會被擋住
    const goal = road.querySelector(".road-tile--goal");
    const xOf = (el) => Math.max(8, Math.min(
      el === goal
        ? el.offsetLeft + el.offsetWidth / 2 - hero.offsetWidth - 10
        : el.offsetLeft + el.offsetWidth / 2 - hero.offsetWidth / 2,
      track.clientWidth - hero.offsetWidth - 8
    ));
    const place = (i) => {
      at = i;
      hero.style.transform = `translateX(${xOf(stops[i])}px)`;
      track.style.setProperty("--bgt", "0s");
      track.style.setProperty("--bgx", `${-xOf(stops[i]) * 0.25}px`);
    };
    // 鏡頭：可橫向捲動時（手機），每一格畫面都把角色置中
    const camera = (x) => {
      if (viewport.scrollWidth <= viewport.clientWidth) return;
      viewport.scrollLeft = x - viewport.clientWidth / 2 + hero.offsetWidth / 2;
    };
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const walkTo = (i) => {
      const from = xOf(stops[at]);
      const to = xOf(stops[i]);
      const ms = Math.abs(to - from) / SPEED * 1000;
      hero.classList.add("is-walking");
      track.style.setProperty("--bgt", `${ms}ms`);
      track.style.setProperty("--bgx", `${-to * 0.25}px`);
      const anim = hero.animate(
        [{ transform: `translateX(${from}px)` }, { transform: `translateX(${to}px)` }],
        { duration: ms, easing: "linear", fill: "forwards" }
      );
      const tick = () => {
        if (anim.playState !== "running") return;
        camera(from + (to - from) * Math.min(anim.currentTime / ms, 1));
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      return anim.finished.then(() => {
        camera(to);
        hero.style.transform = `translateX(${to}px)`;
        anim.cancel();
        hero.classList.remove("is-walking");
        at = i;
      });
    };

    const reset = () => {
      road.classList.remove("is-clear");
      cards.forEach((c) => c.classList.remove("is-active"));
      status.textContent = "READY…";
      place(0);
      viewport.scrollLeft = 0;
    };

    const run = async () => {
      const id = ++runId;
      reset();
      await wait(400);
      for (let i = 1; i < stops.length; i++) {
        await walkTo(i);
        if (id !== runId) return;
        const card = stops[i];
        if (cards.includes(card)) {
          card.classList.add("is-active");
          status.textContent = `STAGE ${cards.indexOf(card) + 1} CLEAR`;
          await wait(900);
          if (id !== runId) return;
        }
      }
      road.classList.add("is-clear");
      status.textContent = "QUEST CLEAR! 申請完成";
    };

    if (reduceMotion) {
      place(stops.length - 1);
      cards.forEach((c) => c.classList.add("is-active"));
      road.classList.add("is-clear");
      status.textContent = "QUEST CLEAR! 申請完成";
    } else {
      place(0);
      const io = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        run();
      }, { threshold: 0.45 });
      io.observe(road);
      replay.addEventListener("click", run);
    }
    window.addEventListener("resize", () => place(at));
  }

  // 職業選擇 → 帶入 LINE 訊息
  const cards = document.querySelectorAll(".class-card");
  const pickName = document.querySelector("[data-pick]");
  const pickLink = document.querySelector("[data-pick-link]");
  const select = (target) => {
    cards.forEach((c) => c.setAttribute("aria-checked", String(c === target)));
    const name = target.dataset.class;
    if (pickName) pickName.textContent = name;
    if (pickLink) {
      pickLink.href = `https://line.me/R/oaMessage/%40slbro/?${encodeURIComponent(`我想申請代理，職業選「${name}」`)}`;
    }
  };
  cards.forEach((c, i) => {
    c.addEventListener("click", () => select(c));
    c.addEventListener("keydown", (e) => {
      const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!dir) return;
      e.preventDefault();
      const next = cards[(i + dir + cards.length) % cards.length];
      next.focus();
      select(next);
    });
  });
})();
