import { getSettings, setSettings } from "../lib/storage.js";
import { confirmModal, dropdown } from "../ui/components.js";
import { MSG } from "../lib/messages.js";

const $ = (id) => document.getElementById(id);
const times = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 ? "30" : "00";
  return `${h}:${m}`;
});

async function resync() { try { await chrome.runtime.sendMessage({ type: MSG.SETTINGS_CHANGED }); } catch {} }

function showSection(sec) {
  document.querySelectorAll(".navitem").forEach((n) => n.classList.toggle("active", n.dataset.sec === sec));
  document.querySelectorAll(".sec").forEach((s) => s.classList.toggle("hidden", s.dataset.sec !== sec));
  if (sec === "rulelimits") renderLimits();
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
  $("invertAllowlist").checked = !!s.invertAllowlist;
  $("userRules").value = s.userRules || "";
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
