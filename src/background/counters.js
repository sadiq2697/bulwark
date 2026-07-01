import { getLocal, setLocal } from "../lib/storage.js";

const perTab = new Map();

export async function getStats(tabId) {
  const total = await getLocal("counters", { total: 0 });
  return { tab: perTab.get(tabId) || 0, total: total.total || 0 };
}

export function initCounters() {
  const dnr = chrome.declarativeNetRequest;
  if (!dnr || !dnr.onRuleMatchedDebug) return; // unavailable unless unpacked
  dnr.onRuleMatchedDebug.addListener(async ({ request }) => {
    const tabId = request.tabId;
    if (tabId >= 0) {
      const n = (perTab.get(tabId) || 0) + 1;
      perTab.set(tabId, n);
      chrome.action.setBadgeText({ tabId, text: n ? String(n) : "" });
      chrome.action.setBadgeBackgroundColor({ tabId, color: "#c0392b" });
    }
    const c = await getLocal("counters", { total: 0 });
    await setLocal("counters", { total: (c.total || 0) + 1 });
  });
  chrome.tabs.onRemoved.addListener((tabId) => perTab.delete(tabId));
}
