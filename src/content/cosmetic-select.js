// Pure selector-merge logic shared between the content script (via dynamic import)
// and unit tests. Given the host and a set of already-enabled selector lists,
// returns the selectors that apply to this host (generic or domain-matched).
export function selectCosmetic(host, lists) {
  const out = [];
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const c of list) {
      if (!c || !c.selector) continue;
      if (c.domains.length === 0 || c.domains.some((d) => host.endsWith(d))) out.push(c.selector);
    }
  }
  return out;
}
