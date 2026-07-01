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
