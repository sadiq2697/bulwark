import { MSG } from "../lib/messages.js";

const $ = (id) => document.getElementById(id);
function hostOf(url) { try { return new URL(url).hostname; } catch { return ""; } }

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function renderStatus(enabled, siteAllowed) {
  const protectedHere = enabled && !siteAllowed;
  $("siteToggle").checked = protectedHere;
  document.querySelector(".status").classList.toggle("off", !protectedHere);
  $("statusText").textContent = !enabled
    ? "Paused everywhere"
    : (siteAllowed ? "Paused on this site" : "Protection on");
}

function sparkline(days) {
  const svg = $("spark");
  const w = 300, h = 72, pad = 4;
  const max = Math.max(1, ...days.map((d) => d.total));
  const step = (w - pad * 2) / Math.max(1, days.length - 1);
  const pts = days.map((d, i) => {
    const x = pad + i * step;
    const y = h - pad - (d.total / max) * (h - pad * 2);
    return [x, y];
  });
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${h} L${pts[0][0].toFixed(1)} ${h} Z`;
  svg.replaceChildren();
  const ns = "http://www.w3.org/2000/svg";
  const a = document.createElementNS(ns, "path");
  a.setAttribute("d", area); a.setAttribute("fill", "#e8f5ee");
  const l = document.createElementNS(ns, "path");
  l.setAttribute("d", line); l.setAttribute("fill", "none");
  l.setAttribute("stroke", "#1f9d63"); l.setAttribute("stroke-width", "2");
  l.setAttribute("stroke-linejoin", "round"); l.setAttribute("vector-effect", "non-scaling-stroke");
  svg.append(a, l);
  const axis = $("chartaxis");
  axis.replaceChildren();
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (const d of days) {
    const [y, m, dd] = d.day.split("-").map(Number);
    const span = document.createElement("span");
    span.textContent = dow[new Date(y, m - 1, dd).getDay()];
    axis.appendChild(span);
  }
}

function breakdown(totals) {
  const rows = [
    { label: "Ads", value: totals.ads },
    { label: "Trackers", value: totals.trackers },
    { label: "Other", value: totals.other },
  ];
  const max = Math.max(1, ...rows.map((r) => r.value));
  const el = $("breakdown");
  el.replaceChildren();
  for (const r of rows) {
    const row = document.createElement("div");
    row.className = "brow";
    const bl = document.createElement("span"); bl.className = "bl"; bl.textContent = r.label;
    const bar = document.createElement("span"); bar.className = "bar";
    const i = document.createElement("i"); i.style.width = `${(r.value / max) * 100}%`; bar.appendChild(i);
    const bv = document.createElement("span"); bv.className = "bv"; bv.textContent = r.value.toLocaleString();
    row.append(bl, bar, bv);
    el.appendChild(row);
  }
}

async function init() {
  const tab = await activeTab();
  const host = hostOf(tab?.url || "");
  $("siteLabel").textContent = host || "This site";

  const state = await chrome.runtime.sendMessage({ type: MSG.GET_STATE, host });
  renderStatus(state.enabled, state.siteAllowed);

  const stats = await chrome.runtime.sendMessage({ type: MSG.GET_STATS, tabId: tab.id });
  $("pageCount").textContent = stats.tab.toLocaleString();
  $("totalCount").textContent = stats.total.toLocaleString();

  const detail = await chrome.runtime.sendMessage({ type: MSG.GET_STATS_DETAIL });
  sparkline(detail.last);
  breakdown(detail.totals);

  $("siteToggle").addEventListener("change", async () => {
    await chrome.runtime.sendMessage({ type: MSG.TOGGLE_SITE, host });
    const s = await chrome.runtime.sendMessage({ type: MSG.GET_STATE, host });
    renderStatus(s.enabled, s.siteAllowed);
  });
  $("pick").addEventListener("click", async () => {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["src/content/picker.js"] });
    window.close();
  });
  const openOpts = () => chrome.runtime.openOptionsPage();
  $("openOptions").addEventListener("click", openOpts);
  $("settings2").addEventListener("click", openOpts);

  document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("active", x === t));
    $("panel-actions").classList.toggle("hidden", t.dataset.tab !== "actions");
    $("panel-stats").classList.toggle("hidden", t.dataset.tab !== "stats");
  }));
}
init();
