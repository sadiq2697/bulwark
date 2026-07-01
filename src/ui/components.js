export function confirmModal({ title, message, confirmText = "Confirm", cancelText = "Cancel" }) {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "bw-backdrop";
    const modal = document.createElement("div");
    modal.className = "bw-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", title);
    const h = document.createElement("h2"); h.textContent = title;
    const p = document.createElement("p"); p.textContent = message;
    const actions = document.createElement("div"); actions.className = "bw-modal-actions";
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "bw-btn bw-cancel"; cancelBtn.textContent = cancelText;
    const confirmBtn = document.createElement("button");
    confirmBtn.className = "bw-btn bw-primary bw-confirm"; confirmBtn.textContent = confirmText;
    actions.append(cancelBtn, confirmBtn);
    modal.append(h, p, actions);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => backdrop.classList.add("bw-open"));
    const close = (val) => {
      backdrop.classList.remove("bw-open");
      document.body.style.overflow = "";
      setTimeout(() => backdrop.remove(), 160);
      document.removeEventListener("keydown", onKey);
      resolve(val);
    };
    const onKey = (e) => { if (e.key === "Escape") close(false); };
    backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(false); });
    backdrop.querySelector(".bw-cancel").addEventListener("click", () => close(false));
    backdrop.querySelector(".bw-confirm").addEventListener("click", () => close(true));
    document.addEventListener("keydown", onKey);
    backdrop.querySelector(".bw-confirm").focus();
  });
}

export function dropdown(anchorEl, items, onSelect) {
  const pop = document.createElement("div");
  pop.className = "bw-dropdown";
  items.forEach((it, i) => {
    const b = document.createElement("button");
    b.className = "bw-dd-item"; b.textContent = it.label; b.tabIndex = -1; b.dataset.i = i;
    b.addEventListener("click", () => { onSelect(it.value); teardown(); });
    pop.appendChild(b);
  });
  const rect = anchorEl.getBoundingClientRect();
  Object.assign(pop.style, { position: "absolute", top: `${rect.bottom + window.scrollY + 4}px`, left: `${rect.left + window.scrollX}px` });
  document.body.appendChild(pop);
  requestAnimationFrame(() => pop.classList.add("bw-open"));
  let idx = 0;
  const buttons = [...pop.querySelectorAll(".bw-dd-item")];
  const focus = (n) => { idx = (n + buttons.length) % buttons.length; buttons[idx].focus(); };
  focus(0);
  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); focus(idx + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); focus(idx - 1); }
    else if (e.key === "Enter") { buttons[idx].click(); }
    else if (e.key === "Escape") { teardown(); }
  };
  const onOutside = (e) => { if (!pop.contains(e.target) && e.target !== anchorEl) teardown(); };
  const teardown = () => {
    pop.classList.remove("bw-open");
    setTimeout(() => pop.remove(), 120);
    document.removeEventListener("keydown", onKey);
    document.removeEventListener("mousedown", onOutside);
  };
  document.addEventListener("keydown", onKey);
  document.addEventListener("mousedown", onOutside);
}
