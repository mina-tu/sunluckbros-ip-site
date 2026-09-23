/* =====================================================
   聯絡我們表單
   ─────────────────────────────────────────────────────
   透過 FormSubmit（免後端的表單寄信服務）把內容寄到官方信箱。
   表單已於 FormSubmit 完成啟用，收件信箱為 slbros@slbros.com。
   網址中的是 FormSubmit 給的隨機代碼（等同該信箱），
   用代碼而不寫出信箱，可避免信箱被爬蟲抓去發垃圾信。
   ===================================================== */
(function () {
  var CONTACT_ENDPOINT = "https://formsubmit.co/ajax/20badc5fd1d7fa6a5632f6696bffd09c";

  var form = document.getElementById("contactForm");
  var notice = document.getElementById("contactNotice");
  if (!form || !notice) return;

  function setNotice(message, isError) {
    notice.textContent = message;
    notice.classList.toggle("is-error", !!isError);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var name = form.elements.name.value.trim();
    var email = form.elements.email.value.trim();
    var message = form.elements.message.value.trim();

    if (!name || !email || !message) {
      setNotice("請填寫姓名、電子信箱與聯絡內容", true);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setNotice("電子信箱格式看起來不正確", true);
      return;
    }

    var submitBtn = form.querySelector(".contact__submit");
    submitBtn.disabled = true;
    setNotice("傳送中…", false);

    fetch(CONTACT_ENDPOINT, {
      method: "POST",
      headers: { "Accept": "application/json" },
      body: new FormData(form)
    })
      .then(function (res) {
        if (!res.ok) throw new Error("bad status " + res.status);
        return res.json();
      })
      .then(function (data) {
        // FormSubmit 失敗時也可能回 200，要看 success 欄位
        if (String(data.success) !== "true") throw new Error(data.message || "send failed");
        form.reset();
        setNotice("已收到您的來信，我們會盡快回覆", false);
      })
      .catch(function () {
        setNotice("傳送失敗，請稍後再試，或直接透過社群訊息與我們聯絡", true);
      })
      .then(function () {
        submitBtn.disabled = false;
      });
  });
})();
