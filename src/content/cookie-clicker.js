// Isolated-world content script: clicks the reject or accept button on cookie
// consent banners. Conservative on purpose, it only acts on buttons inside a
// container that looks like a consent banner, to avoid clicking unrelated UI.
(async () => {
  let action = "hide";
  try {
    const s = await chrome.storage.sync.get({ cookieAction: "hide" });
    action = s.cookieAction;
  } catch { return; }
  if (action === "hide") return;

  const REJECT = /reject all|reject|decline|refuse|only necessary|necessary only|essential only|do not accept|deny|disagree/i;
  const ACCEPT = /accept all|allow all|accept cookies|accept & close|i agree|agree|got it|allow cookies/i;
  const wanted = action === "accept" ? ACCEPT : REJECT;

  function inConsent(el) {
    let n = el;
    for (let i = 0; i < 6 && n; i++, n = n.parentElement) {
      const s = `${n.id || ""} ${typeof n.className === "string" ? n.className : ""}`.toLowerCase();
      if (/cookie|consent|gdpr|ccpa|cmp|privacy|banner/.test(s)) return true;
    }
    return false;
  }

  function tryClick() {
    const els = document.querySelectorAll("button, a[role=button], [role=button], input[type=button], input[type=submit]");
    for (const b of els) {
      const t = (b.textContent || b.value || "").trim();
      if (t.length > 0 && t.length < 40 && wanted.test(t) && b.offsetParent !== null && inConsent(b)) {
        b.click();
        return true;
      }
    }
    return false;
  }

  if (tryClick()) return;
  let tries = 0;
  const iv = setInterval(() => { if (tryClick() || ++tries > 20) clearInterval(iv); }, 500);
})();
