// Pure selector-merge logic shared between the content script (via dynamic import)
// and unit tests. Decides which bundled cosmetic selectors apply to a host,
// honoring the per-list toggles.
export function selectCosmetic({ host, cosmeticAds, cookies, ads, cookieList }) {
  const out = [];
  const pick = (list) => list
    .filter((c) => c.domains.length === 0 || c.domains.some((d) => host.endsWith(d)))
    .map((c) => c.selector);
  if (cosmeticAds) out.push(...pick(ads));
  if (cookies) out.push(...pick(cookieList));
  return out;
}
