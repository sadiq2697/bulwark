import { MSG } from "../lib/messages.js";

const $ = (id) => document.getElementById(id);
function hostOf(url) { try { return new URL(url).hostname; } catch { return ""; } }

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function init() {
  const tab = await activeTab();
  const host = hostOf(tab?.url || "");
  const state = await chrome.runtime.sendMessage({ type: MSG.GET_STATE, host });
  $("enabled").checked = !!state.enabled;
  $("siteAllow").checked = !state.siteAllowed; // checked = blocking ON for this site
  $("siteLabel").textContent = host || "This site";
  const stats = await chrome.runtime.sendMessage({ type: MSG.GET_STATS, tabId: tab.id });
  $("pageCount").textContent = stats.tab;
  $("totalCount").textContent = stats.total;
  $("badge").textContent = stats.tab || "";

  $("enabled").addEventListener("change", async (e) => {
    await chrome.runtime.sendMessage({ type: MSG.SET_ENABLED, enabled: e.target.checked });
  });
  $("siteAllow").addEventListener("change", async () => {
    await chrome.runtime.sendMessage({ type: MSG.TOGGLE_SITE, host });
  });
  $("pick").addEventListener("click", async () => {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["src/content/picker.js"] });
    window.close();
  });
  $("openOptions").addEventListener("click", () => chrome.runtime.openOptionsPage());
}
init();
