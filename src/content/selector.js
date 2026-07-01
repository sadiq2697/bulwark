export function generateSelector(el) {
  if (el.id) return `#${el.id}`;
  const tag = (el.tagName || "div").toLowerCase();
  const classes = Array.from(el.classList || [])
    .filter((c) => c && !/\d{3,}/.test(c)) // drop hashed/generated classes
    .slice(0, 3);
  if (classes.length) return `${tag}.${classes.join(".")}`;
  return tag;
}
