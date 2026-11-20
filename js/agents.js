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

  // 申請表單：三個 STAGE 就是表單欄位，角色跟著填寫進度走，到 GOAL 送出
  // 透過 FormSubmit 寄到官方信箱（與聯絡我們同一個收件端點，收件信箱 slbros@slbros.com）
  const AGENT_ENDPOINT = "https://formsubmit.co/ajax/20badc5fd1d7fa6a5632f6696bffd09c";
  const road = document.querySelector("[data-road]");
  if (road) {
    const viewport = road.querySelector("[data-road-viewport]");
    const hero = road.querySelector("[data-road-hero]");
    const track = hero.parentElement;
    const stops = [...road.querySelectorAll("[data-stop]")];
    const cards = stops.filter((el) => el.classList.contains("road-card"));
    const status = road.querySelector("[data-road-status]");
    const goal = road.querySelector(".road-tile--goal");
    const SPEED = 260; // px / 秒
    let at = 0;
    let target = 0;
    let walking = null;
    let sending = false;

    // 角色組比起點／終點格寬，夾在軌道內避免超出畫面
    // 終點：停在旗桿左邊，旗子才不會被擋住
    const xOf = (el) => Math.max(8, Math.min(
      el === goal
        ? el.offsetLeft + el.offsetWidth / 2 - hero.offsetWidth - 10
        : el.offsetLeft + el.offsetWidth / 2 - hero.offsetWidth / 2,
      track.clientWidth - hero.offsetWidth - 8
    ));
    const place = (i) => {
      at = target = i;
      hero.style.transform = `translateX(${xOf(stops[i])}px)`;
    };
    // 鏡頭：可橫向捲動時（手機），把角色置中
    const camera = (x) => {
      if (viewport.scrollWidth <= viewport.clientWidth) return;
      viewport.scrollLeft = x - viewport.clientWidth / 2 + hero.offsetWidth / 2;
    };
    const walkStep = (i) => {
      const from = xOf(stops[at]);
      const to = xOf(stops[i]);
      const ms = Math.max(Math.abs(to - from) / SPEED * 1000, 1);
      hero.classList.add("is-walking");
      const anim = hero.animate(
        [{ transform: `translateX(${from}px) scaleX(${to < from ? -1 : 1})` }, { transform: `translateX(${to}px) scaleX(${to < from ? -1 : 1})` }],
        { duration: ms, easing: "linear", fill: "forwards" }
      );
      const tick = () => {
        if (anim.playState !== "running") return;
        camera(from + (to - from) * Math.min(anim.currentTime / ms, 1));
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      // 背景分頁時動畫時間軸會暫停，加上逾時保底，避免角色卡在半路
      const done = Promise.race([anim.finished, new Promise((r) => setTimeout(r, ms + 400))]);
      return done.catch(() => {}).then(() => {
        hero.style.transform = `translateX(${to}px)`;
        anim.cancel();
        at = i;
      });
    };
    // 走到第 i 格；走路中途改目標會在下一格重新導航
    const walkTo = (i) => {
      target = i;
      if (reduceMotion) { place(i); return Promise.resolve(); }
      if (walking) return walking;
      walking = (async () => {
        try {
          while (at !== target) {
            await walkStep(at + Math.sign(target - at));
          }
          camera(xOf(stops[at]));
        } finally {
          hero.classList.remove("is-walking");
          walking = null;
        }
      })();
      return walking;
    };

    const fieldsOf = (card) => [...card.querySelectorAll("input, select, textarea")];
    const cardDone = (card) => fieldsOf(card).every((f) => f.checkValidity());
    const firstInvalid = () => cards.find((c) => !cardDone(c));
    const label = (card) => card.querySelector("h3").textContent;

    // 角色跟著填寫進度走：停在第一個還沒完成的關卡，三關都完成就走到 GOAL
    let started = false; // 表單進入畫面後才開始走
    const followProgress = () => {
      if (!started || sending) return;
      const next = firstInvalid();
      const want = next ? stops.indexOf(next) : stops.length - 1;
      if (want !== target) walkTo(want);
    };

    const refresh = () => {
      cards.forEach((c) => c.classList.toggle("is-active", cardDone(c)));
      const next = firstInvalid();
      road.classList.toggle("is-ready", !next);
      followProgress();
      if (sending || road.classList.contains("is-clear")) return;
      status.textContent = next
        ? `STAGE ${cards.indexOf(next) + 1}：${label(next)}`
        : "全部完成！點 GOAL 送出 ▶";
    };

    // 欄位錯誤提示：離開欄位後才標紅，避免一開始整片紅
    road.addEventListener("focusout", (e) => {
      if (e.target.matches("input, select, textarea")) e.target.classList.add("is-touched");
    });
    road.addEventListener("input", () => {
      road.classList.remove("is-clear");
      refresh();
    });
    road.addEventListener("change", refresh);

    const show = (msg, isError) => {
      status.textContent = msg;
      road.classList.toggle("is-error", !!isError);
    };

    road.addEventListener("submit", (e) => {
      e.preventDefault();
      if (sending) return;
      const bad = firstInvalid();
      if (bad) {
        fieldsOf(bad).forEach((f) => f.classList.add("is-touched"));
        const field = fieldsOf(bad).find((f) => !f.checkValidity());
        const email = road.querySelector("#agentEmail");
        show(field === email ? "電子信箱格式看起來不正確" : `STAGE ${cards.indexOf(bad) + 1} 還沒完成：${label(bad)}`, true);
        walkTo(stops.indexOf(bad));
        field.focus({ preventScroll: true });
        return;
      }

      sending = true;
      goal.disabled = true;
      show("傳送中…", false);
      const body = new FormData(road);
      Promise.all([
        walkTo(stops.length - 1),
        fetch(AGENT_ENDPOINT, { method: "POST", headers: { Accept: "application/json" }, body })
          .then((res) => {
            if (!res.ok) throw new Error(`bad status ${res.status}`);
            return res.json();
          })
          .then((data) => {
            // FormSubmit 失敗時也可能回 200，要看 success 欄位
            if (String(data.success) !== "true") throw new Error(data.message || "send failed");
          }),
      ])
        .then(() => {
          road.reset();
          road.querySelectorAll(".is-touched").forEach((f) => f.classList.remove("is-touched"));
          cards.forEach((c) => c.classList.add("is-active"));
          road.classList.add("is-clear");
          show("QUEST CLEAR! 申請已送出，我們會盡快聯絡你", false);
        })
        .catch(() => {
          show("傳送失敗，請稍後再試，或直接加官方 LINE @slbro 私訊我們", true);
        })
        .then(() => {
          sending = false;
          goal.disabled = false;
        });
    });

    place(0);
    refresh();
    status.textContent = "READY… 從 STAGE 1 開始填寫";
    // 進入畫面後角色先走到 STAGE 1
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        started = true;
        followProgress();
      }, { threshold: 0.3 });
      io.observe(road);
    } else {
      started = true;
      followProgress();
    }
    window.addEventListener("resize", () => { if (!walking) place(at); });

    // 從職業卡選好後帶入申請表
    window.__agentPickClass = (name) => {
      const sel = road.querySelector("[data-class-select]");
      if (!sel) return;
      sel.value = name;
      refresh();
    };
  }

  // 職業選擇 → 帶入申請表的「想走的職業」
  const cards = document.querySelectorAll(".class-card");
  const pickName = document.querySelector("[data-pick]");
  const select = (target) => {
    cards.forEach((c) => c.setAttribute("aria-checked", String(c === target)));
    const name = target.dataset.class;
    if (pickName) pickName.textContent = name;
    if (window.__agentPickClass) window.__agentPickClass(name);
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
