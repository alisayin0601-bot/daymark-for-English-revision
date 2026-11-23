(function () {
  try {
    var allowed = ["stone-blue", "white-red", "white-purple", "olive-cream", "slate-amber", "clay-paper"];
    var saved = window.localStorage.getItem("daymark-theme");
    if (allowed.indexOf(saved) !== -1) {
      document.documentElement.setAttribute("data-theme", saved);
    }
  } catch (error) {}
})();
