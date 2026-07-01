// Pure statistics helpers shared by the service worker and unit tests.

export function dayKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Map a matched ruleset id to a display category.
export function categoryFor(rulesetId) {
  if (rulesetId === "ads") return "ads";
  if (rulesetId === "privacy") return "trackers";
  return "other";
}

// Given a { "YYYY-MM-DD": {ads,trackers,other} } map and today's key, return the
// last `n` days (oldest first) with zero-filled gaps, plus category totals.
export function summarize(days, todayKey, n = 7) {
  const [y, m, d] = todayKey.split("-").map(Number);
  const base = new Date(y, m - 1, d);
  const last = [];
  const totals = { ads: 0, trackers: 0, other: 0, total: 0 };
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date(base.getFullYear(), base.getMonth(), base.getDate() - i);
    const key = dayKey(dt);
    const rec = days[key] || {};
    const ads = rec.ads || 0, trackers = rec.trackers || 0, other = rec.other || 0;
    const total = ads + trackers + other;
    last.push({ day: key, ads, trackers, other, total });
    totals.ads += ads; totals.trackers += trackers; totals.other += other; totals.total += total;
  }
  return { last, totals };
}

// Drop day buckets older than `keep` days so local storage stays small.
export function pruneDays(days, todayKey, keep = 30) {
  const [y, m, d] = todayKey.split("-").map(Number);
  const cutoff = new Date(y, m - 1, d - keep + 1);
  const out = {};
  for (const [key, rec] of Object.entries(days)) {
    const [ky, km, kd] = key.split("-").map(Number);
    if (new Date(ky, km - 1, kd) >= cutoff) out[key] = rec;
  }
  return out;
}
