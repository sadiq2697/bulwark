import { getLocal, setLocal } from "../lib/storage.js";
import { dayKey, categoryFor, summarize, pruneDays } from "../lib/stats.js";

const perTab = new Map();
let badgeEnabled = true;

export function setBadgeEnabled(v) {
  badgeEnabled = !!v;
  if (!badgeEnabled) chrome.action.setBadgeText({ text: "" });
}

// Batched accumulator: blocked events can arrive rapidly, so we coalesce writes
// to storage instead of writing on every match.
let pending = { total: 0, today: { ads: 0, trackers: 0, other: 0 } };
let flushTimer = null;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => { flush().catch(() => {}); }, 2000);
}

async function flush() {
  flushTimer = null;
  const d = pending;
  if (!d.total) return;
  pending = { total: 0, today: { ads: 0, trackers: 0, other: 0 } };

  const key = dayKey(new Date());
  const stats = await getLocal("stats", { days: {} });
  const rec = stats.days[key] || { ads: 0, trackers: 0, other: 0 };
  rec.ads += d.today.ads;
  rec.trackers += d.today.trackers;
  rec.other += d.today.other;
  stats.days[key] = rec;
  stats.days = pruneDays(stats.days, key, 30);
  await setLocal("stats", stats);

  const c = await getLocal("counters", { total: 0 });
  await setLocal("counters", { total: (c.total || 0) + d.total });
}

export async function getStats(tabId) {
  const total = await getLocal("counters", { total: 0 });
  return { tab: perTab.get(tabId) || 0, total: (total.total || 0) + pending.total };
}

export async function getStatsDetail() {
  await flush();
  const total = await getLocal("counters", { total: 0 });
  const stats = await getLocal("stats", { days: {} });
  const { last, totals } = summarize(stats.days, dayKey(new Date()), 7);
  return { total: total.total || 0, last, totals };
}

export function initCounters() {
  const dnr = chrome.declarativeNetRequest;
  if (!dnr || !dnr.onRuleMatchedDebug) return; // unavailable unless unpacked
  dnr.onRuleMatchedDebug.addListener((info) => {
    const tabId = info.request.tabId;
    if (tabId >= 0) {
      const n = (perTab.get(tabId) || 0) + 1;
      perTab.set(tabId, n);
      if (badgeEnabled) {
        chrome.action.setBadgeText({ tabId, text: n ? String(n) : "" });
        chrome.action.setBadgeBackgroundColor({ tabId, color: "#c0392b" });
      }
    }
    const cat = categoryFor(info.rule && info.rule.rulesetId);
    pending.total += 1;
    pending.today[cat] += 1;
    scheduleFlush();
  });
  chrome.tabs.onRemoved.addListener((tabId) => perTab.delete(tabId));
}
