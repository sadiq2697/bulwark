// Content script (classic, no ESM import). Message-type strings mirror src/lib/messages.js.
(async () => {
  const GET_SELECTORS = "GET_SELECTORS";

  async function loadBundled(file) {
    try {
      const res = await fetch(chrome.runtime.getURL(`rules/${file}`));
      if (!res.ok) return [];
      return await res.json();
    } catch { return []; }
  }

  function applyHiding(selectors) {
    if (!selectors.length) return;
    const css = selectors.join(",\n") + " { display: none !important; }";
    const style = document.createElement("style");
    style.id = "bulwark-cosmetic";
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  try {
    const host = location.hostname;
    const state = await chrome.runtime.sendMessage({ type: GET_SELECTORS, host });
    if (!state || state.disabled) return;

    // Only fetch the lists whose toggle is on.
    const [ads, cookieList] = await Promise.all([
      state.cosmeticAds ? loadBundled("cosmetic-ads.json") : Promise.resolve([]),
      state.cookies ? loadBundled("cosmetic-cookies.json") : Promise.resolve([]),
    ]);

    let generic = [];
    try {
      const mod = await import(chrome.runtime.getURL("src/content/cosmetic-select.js"));
      generic = mod.selectCosmetic({
        host, cosmeticAds: state.cosmeticAds, cookies: state.cookies, ads, cookieList,
      });
    } catch {
      // Fallback: apply whatever lists were loaded (toggles already gated the fetch).
      generic = [...ads, ...cookieList]
        .filter((c) => c.domains.length === 0 || c.domains.some((d) => host.endsWith(d)))
        .map((c) => c.selector);
    }
    applyHiding([...(state.selectors || []), ...generic]);
  } catch (e) { /* never break the page */ }
})();
