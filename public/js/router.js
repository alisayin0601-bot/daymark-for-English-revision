let routeHandler = null;

export function currentLocation() {
  return {
    path: window.location.pathname,
    search: window.location.search,
    href: window.location.pathname + window.location.search + window.location.hash
  };
}

export function navigate(path, { replace = false, scroll = true } = {}) {
  if (!path || typeof path !== "string") return;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("#")) {
    window.location.href = path;
    return;
  }
  const target = path.startsWith("/") ? path : `/${path}`;
  const current = window.location.pathname + window.location.search;
  if (target === current) {
    if (scroll) window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (replace) window.history.replaceState({}, "", target);
  else window.history.pushState({}, "", target);
  if (routeHandler) routeHandler();
  if (scroll) window.scrollTo({ top: 0, behavior: "auto" });
}

export function replace(path) {
  navigate(path, { replace: true, scroll: false });
}

export function initRouter(handler) {
  routeHandler = handler;
  window.addEventListener("popstate", () => {
    if (routeHandler) routeHandler();
  });
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    const anchor = event.target.closest("a[data-link]");
    if (!anchor) return;
    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("http") || href.startsWith("#") || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
    event.preventDefault();
    navigate(href);
  });
}

export function routeSection(pathname = window.location.pathname) {
  const parts = pathname.split("/").filter(Boolean);
  return parts[0] || "";
}
