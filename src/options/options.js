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

function renderList(ul, items, onRemove) {
  ul.textContent = "";
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
  document.querySelectorAll("[data-ruleset]").forEach((cb) => { cb.checked = !!s.rulesets[cb.dataset.ruleset]; });
  $("schedEnabled").checked = s.schedule.enabled;
  $("startBtn").textContent = `Start: ${s.schedule.start}`;
  $("endBtn").textContent = `End: ${s.schedule.end}`;
  renderList($("blockList"), s.blocklist, async (h) => {
    await setSettings({ blocklist: s.blocklist.filter((x) => x !== h) }); await resync(); render();
  });
  renderList($("listUrls"), s.customListUrls, async (u) => {
    await setSettings({ customListUrls: s.customListUrls.filter((x) => x !== u) }); await resync(); render();
  });
}

function wire() {
  document.querySelectorAll("[data-ruleset]").forEach((cb) => cb.addEventListener("change", async () => {
    const s = await getSettings();
    await setSettings({ rulesets: { ...s.rulesets, [cb.dataset.ruleset]: cb.checked } });
    await resync();
  }));
  $("blockAdd").addEventListener("click", async () => {
    const v = $("blockInput").value.trim(); if (!v) return;
    const s = await getSettings(); await setSettings({ blocklist: [...new Set([...s.blocklist, v])] });
    $("blockInput").value = ""; await resync(); render();
  });
  $("listAdd").addEventListener("click", async () => {
    const v = $("listInput").value.trim(); if (!v) return;
    const s = await getSettings(); await setSettings({ customListUrls: [...new Set([...s.customListUrls, v])] });
    $("listInput").value = ""; await resync(); render();
  });
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
