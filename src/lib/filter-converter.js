const RESOURCE_TYPES = new Set([
  "script", "image", "stylesheet", "xmlhttprequest", "sub_frame",
  "media", "font", "object", "ping", "websocket", "other",
]);
const OPTION_TO_TYPE = { subdocument: "sub_frame", xhr: "xmlhttprequest", css: "stylesheet", img: "image" };

export function extractCosmetic(line) {
  const idx = line.indexOf("##");
  if (idx === -1) return null;
  const domainPart = line.slice(0, idx);
  const selector = line.slice(idx + 2).trim();
  if (!selector) return null;
  const domains = domainPart ? domainPart.split(",").map((d) => d.trim()).filter(Boolean) : [];
  return { selector, domains };
}

export function convertNetworkRule(line, id) {
  const raw = line.trim();
  if (!raw || raw.startsWith("!") || raw.startsWith("[")) return null;
  if (raw.includes("##") || raw.includes("#@#") || raw.includes("#?#")) return null;
  if (raw.startsWith("/") && raw.endsWith("/")) return { skipped: raw };

  const isException = raw.startsWith("@@");
  let body = isException ? raw.slice(2) : raw;

  let options = [];
  const dollar = body.indexOf("$");
  if (dollar !== -1) {
    options = body.slice(dollar + 1).split(",").map((o) => o.trim()).filter(Boolean);
    body = body.slice(0, dollar);
  }
  if (!body) return { skipped: raw };
  // DNR urlFilter must be ASCII; skip non-ASCII patterns so Chrome does not reject the ruleset.
  if (/[^\x00-\x7F]/.test(body)) return { skipped: raw };

  const resourceTypes = [];
  const excludedTypes = [];
  const domainsInclude = [];
  const domainsExclude = [];
  for (const opt of options) {
    if (opt.startsWith("domain=")) {
      for (const d of opt.slice(7).split("|")) {
        if (d.startsWith("~")) domainsExclude.push(d.slice(1));
        else if (d) domainsInclude.push(d);
      }
      continue;
    }
    const neg = opt.startsWith("~");
    const name = neg ? opt.slice(1) : opt;
    const mapped = OPTION_TO_TYPE[name] || name;
    if (RESOURCE_TYPES.has(mapped)) { (neg ? excludedTypes : resourceTypes).push(mapped); continue; }
    if (["third-party", "3p", "first-party", "1p", "important", "all", "document", "popup"].includes(name)) continue;
    return { skipped: raw };
  }

  const condition = { urlFilter: body };
  if (resourceTypes.length) condition.resourceTypes = [...new Set(resourceTypes)];
  if (excludedTypes.length) condition.excludedResourceTypes = [...new Set(excludedTypes)];
  if (domainsInclude.length) condition.initiatorDomains = domainsInclude;
  if (domainsExclude.length) condition.excludedInitiatorDomains = domainsExclude;

  const rule = {
    id,
    priority: isException ? 100 : 1,
    action: { type: isException ? "allow" : "block" },
    condition,
  };
  return { rule };
}

export function convertList(text, startId) {
  const rules = [];
  const cosmetic = [];
  let skipped = 0;
  let id = startId;
  for (const line of text.split(/\r?\n/)) {
    const cos = extractCosmetic(line);
    if (cos && !line.trim().startsWith("!")) { cosmetic.push(cos); continue; }
    const res = convertNetworkRule(line, id);
    if (res === null) continue;
    if (res.skipped) { skipped++; continue; }
    rules.push(res.rule);
    id++;
  }
  return { rules, cosmetic, skipped };
}
