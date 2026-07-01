// Runs in the page's MAIN world (registered dynamically when the toggle is on).
// Blocks window.open calls that are not tied to a recent user gesture, which
// stops popunders and auto-opened ad tabs while allowing genuine user clicks.
(() => {
  if (window.__bulwarkScriptlets) return;
  window.__bulwarkScriptlets = true;

  let lastGesture = 0;
  const mark = () => { lastGesture = Date.now(); };
  for (const evt of ["click", "mousedown", "keydown", "touchstart", "auxclick"]) {
    window.addEventListener(evt, mark, true);
  }

  const nativeOpen = window.open;
  window.open = function (...args) {
    if (Date.now() - lastGesture < 1000) return nativeOpen.apply(this, args);
    return null; // suppress popunder / auto popup
  };
})();
