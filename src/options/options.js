import { getSettings, setSettings } from "../lib/storage.js";
import { confirmModal, dropdown } from "../ui/components.js";
import { applyTheme } from "../lib/theme.js";
import { MSG } from "../lib/messages.js";

const THEME_LABEL = { system: "System", light: "Light", dark: "Dark" };
const COOKIE_LABEL = { hide: "Hide only", reject: "Reject", accept: "Accept" };

const $ = (id) => document.getElementById(id);
const times = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 ? "30" : "00";
  return `${h}:${m}`;
});

async function resync() { try { await chrome.runtime.sendMessage({ type: MSG.SETTINGS_CHANGED }); } catch {} }

function download(name, text, type = "application/json") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function pickFile(input) {
  return new Promise((resolve) => {
    input.onchange = () => {
      const f = input.files[0]; input.value = "";
      if (!f) return resolve(null);
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.readAsText(f);
    };
    input.click();
  });
}

function showSection(sec) {
  document.querySelectorAll(".navitem").forEach((n) => n.classList.toggle("active", n.dataset.sec === sec));
  document.querySelectorAll(".sec").forEach((s) => s.classList.toggle("hidden", s.dataset.sec !== sec));
  if (sec === "rulelimits") renderLimits();
  if (sec === "filters") renderListInfo();
  if (sec === "dashboard") renderDashboard();
  if (sec === "custom") renderPicked();
}

async function renderPicked() {
  const s = await getSettings();
  const ul = $("pickedList");
  ul.replaceChildren();
  const hosts = Object.keys(s.pickedSelectors).filter((h) => (s.pickedSelectors[h] || []).length).sort();
  if (!hosts.length) {
    const li = document.createElement("li");
    li.textContent = "No hidden elements yet.";
    ul.appendChild(li);
    return;
  }
  for (const host of hosts) {
    for (const sel of s.pickedSelectors[host]) {
      const li = document.createElement("li");
      const span = document.createElement("span");
      const h = document.createElement("strong"); h.textContent = host + " ";
      const code = document.createElement("code"); code.textContent = sel;
      span.append(h, code);
      const btn = document.createElement("button"); btn.textContent = "Remove";
      btn.addEventListener("click", async () => {
        const cur = await getSettings();
        const arr = (cur.pickedSelectors[host] || []).filter((x) => x !== sel);
        const picked = { ...cur.pickedSelectors };
        if (arr.length) picked[host] = arr; else delete picked[host];
        await setSettings({ pickedSelectors: picked });
        await resync();
        renderPicked();
      });
      li.append(span, btn);
      ul.appendChild(li);
    }
  }
}

function hostOf(url) { try { return new URL(url).hostname; } catch { return ""; } }
function fmtBytes(n) {
  const u = ["B", "KB", "MB", "GB"]; let i = 0;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${u[i]}`;
}
function fmtDuration(ms) {
  const s = ms / 1000;
  if (s < 60) return `${Math.round(s)}s`;
  const m = s / 60;
  return m < 60 ? `${m.toFixed(1)} min` : `${(m / 60).toFixed(1)} h`;
}

async function renderDashboard() {
  const detail = await chrome.runtime.sendMessage({ type: MSG.GET_STATS_DETAIL, days: 30 });
  const total = (detail && detail.total) || 0;
  $("dbTotal").textContent = total.toLocaleString();
  $("dbData").textContent = fmtBytes(total * 51200); // ~50 KB average per blocked request
  $("dbTime").textContent = fmtDuration(total * 50); // ~50 ms average per request
  const log = await chrome.runtime.sendMessage({ type: MSG.GET_LOG });
  const counts = {};
  for (const e of (log && log.entries) || []) { const h = hostOf(e.url); if (h) counts[h] = (counts[h] || 0) + 1; }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const ul = $("topDomains");
  ul.replaceChildren();
  if (!top.length) {
    const li = document.createElement("li");
    li.textContent = "Nothing blocked yet this session.";
    ul.appendChild(li);
    return;
  }
  for (const [host, n] of top) {
    const li = document.createElement("li");
    const s = document.createElement("span"); s.textContent = host;
    const c = document.createElement("span"); c.className = "cnt"; c.textContent = n.toLocaleString();
    li.append(s, c); ul.appendChild(li);
  }
}

async function renderListInfo() {
  const info = await chrome.runtime.sendMessage({ type: MSG.GET_LIST_INFO });
  if (!info) return;
  const when = info.updatedAt ? new Date(info.updatedAt).toLocaleString() : "not yet";
  $("listInfo").textContent =
    `Last checked: ${when}. Custom lists (${info.customCount}) update automatically. Built-in lists refresh when Bulwark is updated.`;
}

async function renderLimits() {
  const el = $("limits");
  el.replaceChildren();
  const info = await chrome.runtime.sendMessage({ type: MSG.GET_RULE_LIMITS });
  if (!info) return;
  const rows = [
    { title: "Dynamic rules (allowlist, blocklist, custom, user rules)", used: info.dynamicCount, max: info.dynamicMax },
    { title: "Enabled static filter lists", used: info.enabledRulesets.length, max: info.staticRulesetsMax },
    { title: "Static rules still available", used: info.availableStatic, max: null },
  ];
  for (const r of rows) {
    const box = document.createElement("div"); box.className = "limit";
    const t = document.createElement("div"); t.className = "lt"; t.textContent = r.title;
    box.appendChild(t);
    if (r.max) {
      const bar = document.createElement("div"); bar.className = "lb";
      const i = document.createElement("i"); i.style.width = `${Math.min(100, (r.used / r.max) * 100)}%`; bar.appendChild(i);
      box.appendChild(bar);
    }
    const v = document.createElement("div"); v.className = "lv";
    v.textContent = r.max ? `${r.used.toLocaleString()} of ${r.max.toLocaleString()}` : `${r.used.toLocaleString()} remaining`;
    box.appendChild(v);
    el.appendChild(box);
  }
}

function renderList(ul, items, onRemove) {
  ul.replaceChildren();
  items.forEach((it) => {
    const li = document.createElement("li");
    const span = document.createElement("span"); span.textContent = it;
    const btn = document.createElement("button"); btn.textContent = "Remove";
    btn.addEventListener("click", () => onRemove(it));
    li.append(span, btn); ul.appendChild(li);
  });
}

async function render() {
  const s = await getSettings();
  $("enabled").checked = s.enabled;
  document.querySelectorAll("[data-ruleset]").forEach((cb) => { cb.checked = !!s.rulesets[cb.dataset.ruleset]; });
  $("schedEnabled").checked = s.schedule.enabled;
  $("startBtn").textContent = `Start: ${s.schedule.start}`;
  $("endBtn").textContent = `End: ${s.schedule.end}`;
  renderList($("allowList"), s.allowlist, async (h) => {
    await setSettings({ allowlist: s.allowlist.filter((x) => x !== h) }); await resync(); render();
  });
  renderList($("blockList"), s.blocklist, async (h) => {
    await setSettings({ blocklist: s.blocklist.filter((x) => x !== h) }); await resync(); render();
  });
  renderList($("listUrls"), s.customListUrls, async (u) => {
    await setSettings({ customListUrls: s.customListUrls.filter((x) => x !== u) }); await resync(); render();
  });
  document.querySelectorAll("[data-track]").forEach((cb) => { cb.checked = !!s.tracking[cb.dataset.track]; });
  document.querySelectorAll("[data-ui]").forEach((cb) => { cb.checked = !!s.ui[cb.dataset.ui]; });
  document.querySelectorAll("[data-scriptlet]").forEach((cb) => { cb.checked = !!s.scriptlets[cb.dataset.scriptlet]; });
  $("invertAllowlist").checked = !!s.invertAllowlist;
  $("userRules").value = s.userRules || "";
  $("themeBtn").textContent = THEME_LABEL[s.ui.theme] || "System";
  $("cookieActionBtn").textContent = COOKIE_LABEL[s.cookieAction] || "Hide only";
  applyTheme(s.ui.theme);
  $("ver").textContent = "v" + chrome.runtime.getManifest().version;
}

function wire() {
  document.querySelectorAll(".navitem").forEach((n) => n.addEventListener("click", () => {
    showSection(n.dataset.sec); location.hash = n.dataset.sec;
  }));
  if (location.hash) showSection(location.hash.slice(1));

  $("enabled").addEventListener("change", async (e) => {
    await setSettings({ enabled: e.target.checked }); await resync();
  });
  document.querySelectorAll("[data-ruleset]").forEach((cb) => cb.addEventListener("change", async () => {
    const s = await getSettings();
    await setSettings({ rulesets: { ...s.rulesets, [cb.dataset.ruleset]: cb.checked } });
    await resync();
  }));
  document.querySelectorAll("[data-track]").forEach((cb) => cb.addEventListener("change", async () => {
    const s = await getSettings();
    await setSettings({ tracking: { ...s.tracking, [cb.dataset.track]: cb.checked } });
    await resync();
  }));
  document.querySelectorAll("[data-ui]").forEach((cb) => cb.addEventListener("change", async () => {
    const s = await getSettings();
    await setSettings({ ui: { ...s.ui, [cb.dataset.ui]: cb.checked } });
    await resync();
  }));
  document.querySelectorAll("[data-scriptlet]").forEach((cb) => cb.addEventListener("change", async () => {
    const s = await getSettings();
    await setSettings({ scriptlets: { ...s.scriptlets, [cb.dataset.scriptlet]: cb.checked } });
    await resync();
  }));
  $("invertAllowlist").addEventListener("change", async (e) => {
    await setSettings({ invertAllowlist: e.target.checked }); await resync();
  });

  const adder = (inputId, key) => async () => {
    const v = $(inputId).value.trim(); if (!v) return;
    const s = await getSettings();
    await setSettings({ [key]: [...new Set([...s[key], v])] });
    $(inputId).value = ""; await resync(); render();
  };
  $("allowAdd").addEventListener("click", adder("allowInput", "allowlist"));
  $("blockAdd").addEventListener("click", adder("blockInput", "blocklist"));
  $("listAdd").addEventListener("click", adder("listInput", "customListUrls"));

  $("schedEnabled").addEventListener("change", async (e) => {
    const s = await getSettings(); await setSettings({ schedule: { ...s.schedule, enabled: e.target.checked } }); await resync();
  });
  const pickTime = (key, btn, prefix) => btn.addEventListener("click", () => {
    dropdown(btn, times.map((t) => ({ label: t, value: t })), async (val) => {
      const s = await getSettings(); await setSettings({ schedule: { ...s.schedule, [key]: val } });
      btn.textContent = `${prefix}: ${val}`; await resync();
    });
  });
  pickTime("start", $("startBtn"), "Start");
  pickTime("end", $("endBtn"), "End");

  $("cookieActionBtn").addEventListener("click", () => {
    dropdown($("cookieActionBtn"), [
      { label: "Hide only", value: "hide" },
      { label: "Reject", value: "reject" },
      { label: "Accept", value: "accept" },
    ], async (val) => {
      await setSettings({ cookieAction: val });
      $("cookieActionBtn").textContent = COOKIE_LABEL[val];
      await resync();
    });
  });
  $("themeBtn").addEventListener("click", () => {
    dropdown($("themeBtn"), [
      { label: "System", value: "system" },
      { label: "Light", value: "light" },
      { label: "Dark", value: "dark" },
    ], async (val) => {
      const s = await getSettings();
      await setSettings({ ui: { ...s.ui, theme: val } });
      $("themeBtn").textContent = THEME_LABEL[val];
      applyTheme(val);
    });
  });
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", async () => {
      const s = await getSettings(); applyTheme(s.ui.theme);
    });
  }

  $("updateLists").addEventListener("click", async () => {
    $("updateLists").textContent = "Updating...";
    await chrome.runtime.sendMessage({ type: MSG.UPDATE_LISTS });
    await renderListInfo();
    $("updateLists").textContent = "Update now";
  });
  $("exportSettings").addEventListener("click", async () => {
    const s = await getSettings();
    download("bulwark-profile.json", JSON.stringify({ __bulwark: 1, settings: s }, null, 2));
  });
  $("importSettings").addEventListener("click", async () => {
    const text = await pickFile($("importFile"));
    if (!text) return;
    try {
      const data = JSON.parse(text);
      const settings = data && data.__bulwark ? data.settings : data; // accept profile or raw settings
      if (settings && typeof settings === "object") { await setSettings(settings); await resync(); render(); }
    } catch { /* invalid file, ignore */ }
  });
  $("allowExport").addEventListener("click", async () => {
    const s = await getSettings();
    download("bulwark-allowlist.txt", s.allowlist.join("\n"), "text/plain");
  });
  $("allowImport").addEventListener("click", async () => {
    const text = await pickFile($("allowFile"));
    if (!text) return;
    const hosts = text.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    const s = await getSettings();
    await setSettings({ allowlist: [...new Set([...s.allowlist, ...hosts])] });
    await resync(); render();
  });

  $("userRulesSave").addEventListener("click", async () => {
    await setSettings({ userRules: $("userRules").value });
    await resync();
    const st = $("userRulesStatus");
    st.textContent = "Saved";
    setTimeout(() => { st.textContent = ""; }, 1800);
  });

  $("clearPicked").addEventListener("click", async () => {
    const ok = await confirmModal({
      title: "Clear picked elements",
      message: "This removes all elements you hid with the picker.",
      confirmText: "Clear", cancelText: "Keep",
    });
    if (ok) { await setSettings({ pickedSelectors: {} }); }
  });
}

render(); wire();
