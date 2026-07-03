// Lightweight i18n helper. Pages can localize by adding a data-i18n="key"
// attribute to any element; call applyI18n() on load to fill in the text.
// Attribute localization: data-i18n-attr="placeholder:someKey;title:otherKey".
export function t(key, subs) {
  return (chrome.i18n && chrome.i18n.getMessage(key, subs)) || key;
}

export function applyI18n(root = document) {
  for (const el of root.querySelectorAll("[data-i18n]")) {
    const msg = t(el.dataset.i18n);
    if (msg) el.textContent = msg;
  }
  for (const el of root.querySelectorAll("[data-i18n-attr]")) {
    for (const pair of el.dataset.i18nAttr.split(";")) {
      const [attr, key] = pair.split(":").map((x) => x.trim());
      if (!attr || !key) continue;
      const msg = t(key);
      if (msg) el.setAttribute(attr, msg);
    }
  }
}
