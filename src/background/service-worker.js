import { getSettings, setSettings, getLocal, setLocal } from "../lib/storage.js";
import { allowlistRules, blocklistRules, RESERVED } from "./dnr.js";
import { isWithinWindow } from "./schedule.js";
import { initCounters, getStats, getStatsDetail } from "./counters.js";
import { convertList } from "../lib/filter-converter.js";
import { MSG } from "../lib/messages.js";

const BLOCK_PAGE = chrome.runtime.getURL("pages/blocked.html");
const MAX_CUSTOM = 20000;

function hostOf(url) { try { return new URL(url).hostname; } catch { return ""; } }

async function buildCustomRules() {
  const s = await getSettings();
  const cache = await getLocal("customRulesCache", {});
  const out = [];
  let id = RESERVED.CUSTOM_START;
  for (const url of s.customListUrls) {
    let text = cache[url]?.text;
    try {
      const res = await fetch(url);
      if (res.ok) { text = await res.text(); cache[url] = { text, fetchedAt: Date.now() }; }
    } catch { /* keep last-good cached copy */ }
    if (!text) continue;
    const { rules } = convertList(text, id);
    for (const r of rules) { if (out.length >= MAX_CUSTOM) break; r.id = id++; out.push(r); }
  }
  await setLocal("customRulesCache", cache);
  return out;
}

async function syncDynamicRules(extraRules = []) {
  const s = await getSettings();
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existing.map((r) => r.id);
  let addRules = [];
  if (s.enabled) {
    addRules = addRules.concat(allowlistRules(s.allowlist));
    const scheduleActive = s.schedule.enabled ? isWithinWindow(s.schedule) : true;
    if (scheduleActive) addRules = addRules.concat(blocklistRules(s.blocklist, BLOCK_PAGE));
    addRules = addRules.concat(extraRules);
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: [...(s.rulesets.ads ? ["ads"] : []), ...(s.rulesets.privacy ? ["privacy"] : [])],
      disableRulesetIds: [...(!s.rulesets.ads ? ["ads"] : []), ...(!s.rulesets.privacy ? ["privacy"] : [])],
    });
  } else {
    await chrome.declarativeNetRequest.updateEnabledRulesets({ disableRulesetIds: ["ads", "privacy"] });
  }
  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules });
}

// Rebuilds everything including custom lists (used on install, options edits, and the list alarm).
async function fullSync() {
  const custom = await buildCustomRules();
  await syncDynamicRules(custom);
}

async function toggleSite(host) {
  const s = await getSettings();
  const allowlist = s.allowlist.includes(host)
    ? s.allowlist.filter((h) => h !== host)
    : [...s.allowlist, host];
  await setSettings({ allowlist });
  await fullSync();
  return allowlist.includes(host);
}

chrome.runtime.onInstalled.addListener(fullSync);
chrome.runtime.onStartup.addListener(fullSync);
initCounters();

chrome.alarms.create("bulwark-tick", { periodInMinutes: 5 });
chrome.alarms.create("bulwark-lists", { periodInMinutes: 720 });
chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === "bulwark-tick") syncDynamicRules().catch(() => {});
  else if (a.name === "bulwark-lists") fullSync().catch(() => {});
});

chrome.commands.onCommand.addListener(async (cmd) => {
  if (cmd !== "toggle-site") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.url) await toggleSite(hostOf(tab.url));
});

// When a top-frame navigation to an ad domain is blocked, Chrome shows a bare
// ERR_BLOCKED_BY_CLIENT page. Replace it with our own blocked page. Sub-resource
// blocks never trigger a navigation error, so only clicked ad links are affected.
chrome.webNavigation.onErrorOccurred.addListener((d) => {
  if (d.frameId !== 0) return;
  if (typeof d.error === "string" && d.error.includes("BLOCKED_BY_CLIENT")) {
    chrome.tabs.update(d.tabId, { url: chrome.runtime.getURL("pages/blocked.html") }).catch(() => {});
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg.type === MSG.GET_STATE) {
      const s = await getSettings();
      const host = msg.host || "";
      sendResponse({ enabled: s.enabled, siteAllowed: s.allowlist.includes(host), host });
    } else if (msg.type === MSG.SETTINGS_CHANGED) {
      await fullSync();
      sendResponse({ ok: true });
    } else if (msg.type === MSG.SET_ENABLED) {
      await setSettings({ enabled: msg.enabled });
      await fullSync();
      sendResponse({ ok: true });
    } else if (msg.type === MSG.TOGGLE_SITE) {
      const allowed = await toggleSite(msg.host);
      sendResponse({ siteAllowed: allowed });
    } else if (msg.type === MSG.GET_STATS) {
      sendResponse(await getStats(msg.tabId));
    } else if (msg.type === MSG.GET_STATS_DETAIL) {
      sendResponse(await getStatsDetail());
    } else if (msg.type === MSG.GET_SELECTORS) {
      const s = await getSettings();
      const host = msg.host || "";
      sendResponse({
        selectors: s.pickedSelectors[host] || [],
        disabled: s.allowlist.includes(host) || !s.enabled,
        cosmeticAds: s.rulesets.cosmeticAds,
        cookies: s.rulesets.cookies,
      });
    } else if (msg.type === MSG.ADD_SELECTOR) {
      const s = await getSettings();
      const host = msg.host;
      const list = new Set(s.pickedSelectors[host] || []);
      list.add(msg.selector);
      await setSettings({ pickedSelectors: { ...s.pickedSelectors, [host]: [...list] } });
      sendResponse({ ok: true });
    }
  })();
  return true; // keep the message channel open for the async response
});
