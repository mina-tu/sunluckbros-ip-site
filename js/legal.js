/* =====================================================
   法律頁目錄：捲動時標示目前閱讀的段落
   ===================================================== */
(function () {
  var links = Array.prototype.slice.call(document.querySelectorAll(".legal__toc a"));
  if (!links.length || !("IntersectionObserver" in window)) return;

  var byId = {};
  links.forEach(function (link) {
    byId[link.getAttribute("href").slice(1)] = link;
  });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      links.forEach(function (link) { link.classList.remove("is-active"); });
      var active = byId[entry.target.id];
      if (active) active.classList.add("is-active");
    });
  }, { rootMargin: "-30% 0px -60% 0px" });

  Object.keys(byId).forEach(function (id) {
    var section = document.getElementById(id);
    if (section) observer.observe(section);
  });
})();
