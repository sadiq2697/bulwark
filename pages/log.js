// Filtering log page (extension page, classic script).
function fmtTime(t) {
  const d = new Date(t);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

async function render() {
  const content = document.getElementById("content");
  content.replaceChildren();
  const res = await chrome.runtime.sendMessage({ type: "GET_LOG" });
  const entries = (res && res.entries) || [];
  if (!entries.length) {
    const e = document.createElement("div");
    e.className = "empty";
    e.textContent = "Nothing blocked yet in this session. Browse a little and refresh.";
    content.appendChild(e);
    return;
  }
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const hr = document.createElement("tr");
  ["Time", "Type", "Blocked request"].forEach((h) => {
    const th = document.createElement("th"); th.textContent = h; hr.appendChild(th);
  });
  thead.appendChild(hr); table.appendChild(thead);
  const tbody = document.createElement("tbody");
  for (const e of entries) {
    const tr = document.createElement("tr");
    const t = document.createElement("td"); t.textContent = fmtTime(e.t);
    const c = document.createElement("td");
    const tag = document.createElement("span");
    tag.className = "tag " + (e.category || "other");
    tag.textContent = e.category || "other";
    c.appendChild(tag);
    const u = document.createElement("td"); u.className = "url"; u.textContent = e.url;
    tr.append(t, c, u); tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  content.appendChild(table);
}

document.getElementById("refresh").addEventListener("click", render);
render();
