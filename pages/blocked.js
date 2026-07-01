// Block page (extension page, classic script).
function blockedUrl() {
  const m = location.hash.match(/#url=(.*)$/);
  if (!m) return "";
  try { return decodeURIComponent(m[1]); } catch { return ""; }
}
function hostOf(url) { try { return new URL(url).hostname; } catch { return ""; } }

const url = blockedUrl();
const host = hostOf(url);
if (host) document.getElementById("host").textContent = host;

document.getElementById("back").addEventListener("click", () => {
  if (history.length > 1) history.back();
  else chrome.tabs && chrome.tabs.getCurrent((t) => t && chrome.tabs.remove(t.id));
});

document.getElementById("proceed").addEventListener("click", async () => {
  if (host) {
    try { await chrome.runtime.sendMessage({ type: "BYPASS_SITE", host }); } catch {}
  }
  if (url) location.href = url;
});
