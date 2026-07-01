export const DEFAULTS = {
  enabled: true,
  allowlist: [],
  blocklist: [],
  schedule: { enabled: false, days: [1, 2, 3, 4, 5], start: "09:00", end: "17:00" },
  customListUrls: [],
  userRules: "",
  pickedSelectors: {},
  rulesets: { ads: true, privacy: true, cosmeticAds: true, cookies: true },
  tracking: { webrtc: false, gpc: false, xclientdata: false },
  ui: { badge: true, contextMenu: true, theme: "system" },
  invertAllowlist: false,
};

export async function getSettings() {
  const stored = await chrome.storage.sync.get(DEFAULTS);
  return {
    ...DEFAULTS,
    ...stored,
    schedule: { ...DEFAULTS.schedule, ...(stored.schedule || {}) },
    rulesets: { ...DEFAULTS.rulesets, ...(stored.rulesets || {}) },
    tracking: { ...DEFAULTS.tracking, ...(stored.tracking || {}) },
    ui: { ...DEFAULTS.ui, ...(stored.ui || {}) },
    pickedSelectors: stored.pickedSelectors || {},
  };
}

export async function setSettings(partial) {
  const current = await getSettings();
  const merged = { ...current, ...partial };
  await chrome.storage.sync.set(merged);
  return merged;
}

export async function getLocal(key, fallback) {
  const out = await chrome.storage.local.get({ [key]: fallback });
  return out[key];
}

export async function setLocal(key, value) {
  await chrome.storage.local.set({ [key]: value });
}
