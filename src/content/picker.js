// Injected on demand via chrome.scripting.executeScript (classic script).
// Reuses the tested generateSelector via dynamic import of the web-accessible module.
(() => {
  if (window.__bulwarkPicker) return;
  window.__bulwarkPicker = true;
  const ADD_SELECTOR = "ADD_SELECTOR";

  const box = document.createElement("div");
  Object.assign(box.style, {
    position: "fixed", zIndex: 2147483647, border: "2px solid #c0392b",
    background: "rgba(192,57,43,0.15)", pointerEvents: "none", top: "0", left: "0",
    width: "0", height: "0", transition: "all 40ms ease",
  });
  document.documentElement.appendChild(box);

  let current = null;
  let generateSelector = (el) => (el.id ? `#${el.id}` : (el.tagName || "div").toLowerCase());
  import(chrome.runtime.getURL("src/content/selector.js"))
    .then((m) => { if (m && m.generateSelector) generateSelector = m.generateSelector; })
    .catch(() => { /* fall back to the inline generator above */ });

  function onMove(e) {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || el === box) return;
    current = el;
    const r = el.getBoundingClientRect();
    Object.assign(box.style, { top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, height: `${r.height}px` });
  }
  function cleanup() {
    document.removeEventListener("mousemove", onMove, true);
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("keydown", onKey, true);
    box.remove();
    window.__bulwarkPicker = false;
  }
  async function onClick(e) {
    e.preventDefault(); e.stopPropagation();
    if (!current) return;
    const selector = generateSelector(current);
    try { current.style.setProperty("display", "none", "important"); } catch {}
    await chrome.runtime.sendMessage({ type: ADD_SELECTOR, host: location.hostname, selector });
    cleanup();
  }
  function onKey(e) { if (e.key === "Escape") cleanup(); }

  document.addEventListener("mousemove", onMove, true);
  document.addEventListener("click", onClick, true);
  document.addEventListener("keydown", onKey, true);
})();
