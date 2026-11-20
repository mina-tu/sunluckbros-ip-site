/* 全站背景音樂
   - 用 <audio> 播放（本機直接開 index.html 也能播，不需要 fetch）
   - 進站預設「開啟」：喇叭顯示有聲音
   - 瀏覽器擋自動播放時，訪客第一次點擊／觸控／按鍵就開始播 */
(() => {
  'use strict';
  const button = document.getElementById('homeMusic');
  if (!button) return;

  const audio = new Audio();
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = 0.55;
  audio.src = audio.canPlayType('audio/mp4; codecs="mp4a.40.2"')
    ? 'audio/sunluck-cloud.m4a'
    : 'audio/sunluck-cloud.wav';

  // 換頁時接續：播放位置存在本分頁（sessionStorage），靜音選擇記在瀏覽器（localStorage）
  const store = (area, key, value) => {
    try {
      if (value === undefined) return window[area].getItem(key);
      window[area].setItem(key, value);
    } catch (e) { /* 隱私模式等情況拿不到儲存空間，忽略 */ }
    return null;
  };
  const savedTime = parseFloat(store('sessionStorage', 'slbMusicTime'));
  if (savedTime > 0) {
    audio.addEventListener('loadedmetadata', () => {
      if (savedTime < audio.duration) audio.currentTime = savedTime;
    }, { once: true });
  }
  const saveTime = () => store('sessionStorage', 'slbMusicTime', String(audio.currentTime || 0));
  window.addEventListener('pagehide', saveTime);
  setInterval(() => { if (!audio.paused) saveTime(); }, 1000);

  let wanted = store('localStorage', 'slbMusicMuted') !== '1'; // 預設開，除非訪客關過
  let failed = false;
  const remember = () => store('localStorage', 'slbMusicMuted', wanted ? '0' : '1');

  // 喇叭圖示跟著「是否開啟」走；開啟中只是等互動時也顯示有聲音
  function paint() {
    const on = wanted && !failed;
    button.dataset.state = failed ? 'error' : on ? 'playing' : 'muted';
    button.classList.toggle('is-pending', on && audio.paused);
    button.setAttribute('aria-pressed', String(on));
    const label = failed ? '音樂載入失敗，點擊重試' : on ? '關閉音樂' : '開啟音樂';
    button.setAttribute('aria-label', label);
    button.title = label;
  }

  function play() {
    const p = audio.play();
    if (p && p.catch) p.catch((err) => {
      // NotAllowedError = 瀏覽器在等互動，不算失敗
      if (err && err.name !== 'NotAllowedError' && err.name !== 'AbortError') {
        failed = true;
        console.error('Background music could not play:', err);
      }
      paint();
    });
  }

  audio.addEventListener('playing', paint);
  audio.addEventListener('pause', paint);
  audio.addEventListener('error', () => { failed = true; paint(); });

  // 第一次互動：把被擋下的自動播放補上
  let unlockedByButton = false;
  function unlock(event) {
    if (!wanted || !audio.paused) return;
    if (event.type === 'keydown' && ['Tab', 'Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) return;
    unlockedByButton = button.contains(event.target);
    play();
  }
  ['pointerdown', 'touchend', 'keydown'].forEach((type) =>
    document.addEventListener(type, unlock, { capture: true, passive: true }));

  button.addEventListener('click', (event) => {
    event.stopPropagation();
    // 這次點擊剛好是解鎖播放的那一下：當作「開始播」，不切成靜音
    if (unlockedByButton) { unlockedByButton = false; return; }
    if (failed) {
      failed = false;
      wanted = true;
      audio.load();
      play();
    } else if (wanted && !audio.paused) {
      wanted = false;
      audio.pause();
      remember();
    } else {
      wanted = true;
      play();
      remember();
    }
    paint();
  });

  // 切到別的分頁就暫停，回來再續播
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (!audio.paused) audio.pause(); }
    else if (wanted) play();
  });

  paint();
  if (wanted) play();
})();
