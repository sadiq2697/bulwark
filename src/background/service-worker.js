import { getSettings, setSettings, getLocal, setLocal } from "../lib/storage.js";
import { allowlistRules, blocklistRules, trackingRules, RESERVED } from "./dnr.js";
import { isWithinWindow } from "./schedule.js";
import { initCounters, getStats, getStatsDetail, getLog, setBadgeEnabled } from "./counters.js";
import { convertList } from "../lib/filter-converter.js";
import { MSG } from "../lib/messages.js";

const BLOCK_PAGE = chrome.runtime.getURL("pages/blocked.html");
const MAX_CUSTOM = 20000;
const NETWORK_RULESETS = ["ads", "privacy", "social", "annoyances", "security"];

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
    if (s.invertAllowlist) {
      const cond = { resourceTypes: ["main_frame", "sub_frame"] };
      if (s.allowlist.length) cond.excludedRequestDomains = s.allowlist;
      addRules.push({ id: RESERVED.ALLOW_START, priority: 1000, action: { type: "allowAllRequests" }, condition: cond });
    } else {
      addRules = addRules.concat(allowlistRules(s.allowlist));
    }
    const scheduleActive = s.schedule.enabled ? isWithinWindow(s.schedule) : true;
    if (scheduleActive) addRules = addRules.concat(blocklistRules(s.blocklist, BLOCK_PAGE));
    addRules = addRules.concat(trackingRules(s.tracking));
    addRules = addRules.concat(extraRules);
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: NETWORK_RULESETS.filter((id) => s.rulesets[id]),
      disableRulesetIds: NETWORK_RULESETS.filter((id) => !s.rulesets[id]),
    });
  } else {
    await chrome.declarativeNetRequest.updateEnabledRulesets({ disableRulesetIds: NETWORK_RULESETS });
  }
  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules });
}

async function buildUserRules() {
  const s = await getSettings();
  if (!s.userRules || !s.userRules.trim()) return [];
  const { rules } = convertList(s.userRules, RESERVED.USER_START);
  return rules.map((r, i) => ({ ...r, id: RESERVED.USER_START + i, priority: Math.max(r.priority || 1, 50) }));
}

async function setupContextMenu(s) {
  if (!chrome.contextMenus) return;
  await chrome.contextMenus.removeAll();
  if (!s.ui.contextMenu) return;
  chrome.contextMenus.create({ id: "bulwark-pick", title: "Hide an element", contexts: ["page"] });
  chrome.contextMenus.create({ id: "bulwark-allow", title: "Toggle blocking on this site", contexts: ["page"] });
}

const SCRIPTLETS = [
  { id: "bulwark-popups", flag: "popups", file: "src/content/scriptlets.js" },
  { id: "bulwark-redirect", flag: "redirect", file: "src/content/scriptlet-redirect.js" },
];

async function applyScriptlets(s) {
  for (const sc of SCRIPTLETS) {
    try {
      const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [sc.id] });
      const want = !!s.scriptlets[sc.flag];
      if (want && !existing.length) {
        await chrome.scripting.registerContentScripts([{
          id: sc.id, matches: ["<all_urls>"], js: [sc.file],
          runAt: "document_start", world: "MAIN", allFrames: true,
        }]);
      } else if (!want && existing.length) {
        await chrome.scripting.unregisterContentScripts({ ids: [sc.id] });
      }
    } catch { /* registerContentScripts world:MAIN needs a recent Chrome */ }
  }
}

async function applyCookieClicker(s) {
  const ID = "bulwark-cookies";
  try {
    const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [ID] });
    const want = s.cookieAction && s.cookieAction !== "hide";
    if (want && !existing.length) {
      await chrome.scripting.registerContentScripts([{
        id: ID, matches: ["<all_urls>"], js: ["src/content/cookie-clicker.js"], runAt: "document_end",
      }]);
    } else if (!want && existing.length) {
      await chrome.scripting.unregisterContentScripts({ ids: [ID] });
    }
  } catch { /* ignore */ }
}

// Applies settings that are not DNR rules: badge visibility, WebRTC policy, context menu, scriptlets.
async function applySideSettings() {
  const s = await getSettings();
  setBadgeEnabled(s.ui.badge);
  try {
    const p = chrome.privacy && chrome.privacy.network && chrome.privacy.network.webRTCIPHandlingPolicy;
    if (p) p.set({ value: s.tracking.webrtc ? "default_public_interface_only" : "default" });
  } catch { /* privacy API may be unavailable */ }
  await setupContextMenu(s);
  await applyScriptlets(s);
  await applyCookieClicker(s);
}

// Rebuilds everything including custom lists and user rules (used on install,
// options edits, and the list alarm).
async function fullSync() {
  const [custom, user] = await Promise.all([buildCustomRules(), buildUserRules()]);
  await syncDynamicRules(custom.concat(user));
  await applySideSettings();
  await setLocal("listsUpdatedAt", Date.now());
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

chrome.runtime.onInstalled.addListener((details) => {
  fullSync();
  if (details.reason === "install") {
    chrome.tabs.create({ url: chrome.runtime.getURL("pages/welcome.html") }).catch(() => {});
  }
});
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

if (chrome.contextMenus) {
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (!tab) return;
    if (info.menuItemId === "bulwark-pick") {
      chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["src/content/picker.js"] }).catch(() => {});
    } else if (info.menuItemId === "bulwark-allow" && tab.url) {
      await toggleSite(hostOf(tab.url));
    }
  });
}

// When a top-frame navigation to an ad domain is blocked, Chrome shows a bare
// ERR_BLOCKED_BY_CLIENT page. Replace it with our own blocked page. Sub-resource
// blocks never trigger a navigation error, so only clicked ad links are affected.
chrome.webNavigation.onErrorOccurred.addListener((d) => {
  if (d.frameId !== 0) return;
  if (typeof d.error === "string" && d.error.includes("BLOCKED_BY_CLIENT")) {
    const target = chrome.runtime.getURL("pages/blocked.html") + "#url=" + encodeURIComponent(d.url || "");
    chrome.tabs.update(d.tabId, { url: target }).catch(() => {});
  }
});

// Temporary "proceed anyway": add a session allow rule so the host loads until
// the browser restarts, without touching the saved allowlist.
async function bypassSite(host) {
  if (!host) return;
  const id = 900000 + (Math.abs(hashCode(host)) % 90000);
  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [id],
    addRules: [{
      id, priority: 5000, action: { type: "allowAllRequests" },
      condition: { requestDomains: [host], resourceTypes: ["main_frame", "sub_frame"] },
    }],
  });
}
function hashCode(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg.type === MSG.GET_STATE) {
      const s = await getSettings();
      const host = msg.host || "";
      sendResponse({ enabled: s.enabled, siteAllowed: s.allowlist.includes(host), host, theme: s.ui.theme });
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
    } else if (msg.type === MSG.BYPASS_SITE) {
      await bypassSite(msg.host);
      sendResponse({ ok: true });
    } else if (msg.type === MSG.GET_STATS) {
      sendResponse(await getStats(msg.tabId));
    } else if (msg.type === MSG.GET_STATS_DETAIL) {
      sendResponse(await getStatsDetail(msg.days || 7));
    } else if (msg.type === MSG.GET_LOG) {
      sendResponse({ entries: getLog() });
    } else if (msg.type === MSG.UPDATE_LISTS) {
      await fullSync();
      sendResponse({ updatedAt: await getLocal("listsUpdatedAt", 0) });
    } else if (msg.type === MSG.GET_LIST_INFO) {
      const s = await getSettings();
      sendResponse({ updatedAt: await getLocal("listsUpdatedAt", 0), customCount: s.customListUrls.length });
    } else if (msg.type === MSG.GET_RULE_LIMITS) {
      const dnr = chrome.declarativeNetRequest;
      const [enabled, dynamic] = await Promise.all([
        dnr.getEnabledRulesets(),
        dnr.getDynamicRules(),
      ]);
      const availableStatic = await dnr.getAvailableStaticRuleCount();
      sendResponse({
        enabledRulesets: enabled,
        availableStatic,
        dynamicCount: dynamic.length,
        dynamicMax: dnr.MAX_NUMBER_OF_DYNAMIC_RULES || 30000,
        staticRulesetsMax: dnr.MAX_NUMBER_OF_ENABLED_STATIC_RULESETS || 50,
      });
    } else if (msg.type === MSG.GET_SELECTORS) {
      const s = await getSettings();
      const host = msg.host || "";
      sendResponse({
        selectors: s.pickedSelectors[host] || [],
        disabled: s.allowlist.includes(host) || !s.enabled,
        cosmeticAds: s.rulesets.cosmeticAds,
        cookies: s.rulesets.cookies,
        social: s.rulesets.social,
        annoyances: s.rulesets.annoyances,
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
