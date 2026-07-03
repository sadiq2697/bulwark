// MAIN-world scriptlet: blocks programmatic same-tab navigations and new windows
// that jump to a different site without a recent user gesture. Genuine link
// clicks (which set a gesture) pass through. Note: direct `location.href = ...`
// assignment cannot be intercepted by extensions, so this covers assign/replace/open.
(() => {
  if (window.__bulwarkRedirectGuard) return;
  window.__bulwarkRedirectGuard = true;

  let lastGesture = 0;
  for (const evt of ["click", "mousedown", "keydown", "touchstart", "auxclick", "submit"]) {
    window.addEventListener(evt, () => { lastGesture = Date.now(); }, true);
  }
  const gestured = () => Date.now() - lastGesture < 1500;

  const regDomain = (host) => String(host).split(".").slice(-2).join(".");
  function crossSite(url) {
    try {
      const u = new URL(url, location.href);
      if (u.protocol !== "http:" && u.protocol !== "https:") return false;
      return regDomain(u.hostname) !== regDomain(location.hostname);
    } catch { return false; }
  }
  const guard = (fn, thisArg, args, urlArg) =>
    (crossSite(urlArg) && !gestured()) ? null : fn.apply(thisArg, args);

  try {
    const assign = location.assign.bind(location);
    location.assign = function (u) { return guard(assign, location, [u], u); };
  } catch { /* non-writable in some engines */ }
  try {
    const replace = location.replace.bind(location);
    location.replace = function (u) { return guard(replace, location, [u], u); };
  } catch { /* non-writable in some engines */ }

  const nativeOpen = window.open;
  window.open = function (u, ...rest) { return guard(nativeOpen, this, [u, ...rest], u); };
})();
