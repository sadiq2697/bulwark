export const RESERVED = { ALLOW_START: 1000000, BLOCK_START: 2000000, CUSTOM_START: 3000000, USER_START: 3500000, TRACK_START: 4000000 };

const ALL_TYPES = ["main_frame", "sub_frame", "stylesheet", "script", "image", "font",
  "object", "xmlhttprequest", "ping", "media", "websocket", "other"];

// Adds a Global Privacy Control request header on every request.
export function gpcHeaderRule(id) {
  return {
    id, priority: 5,
    action: { type: "modifyHeaders", requestHeaders: [{ header: "Sec-GPC", operation: "set", value: "1" }] },
    condition: { resourceTypes: ALL_TYPES },
  };
}

// Strips Chrome's X-Client-Data header sent to Google properties.
export function removeXClientDataRule(id) {
  return {
    id, priority: 5,
    action: { type: "modifyHeaders", requestHeaders: [{ header: "X-Client-Data", operation: "remove" }] },
    condition: {
      requestDomains: ["google.com", "youtube.com", "doubleclick.net", "googlesyndication.com", "googleadservices.com", "google-analytics.com"],
      resourceTypes: ALL_TYPES,
    },
  };
}

// Builds the tracking-protection dynamic rules for the enabled toggles.
export function trackingRules(tracking) {
  const out = [];
  let id = RESERVED.TRACK_START;
  if (tracking.gpc) out.push(gpcHeaderRule(id++));
  if (tracking.xclientdata) out.push(removeXClientDataRule(id++));
  return out;
}

export function allowlistRules(allowlist) {
  return allowlist.map((host, i) => ({
    id: RESERVED.ALLOW_START + i,
    priority: 1000,
    action: { type: "allowAllRequests" },
    condition: { requestDomains: [host], resourceTypes: ["main_frame", "sub_frame"] },
  }));
}

function reEscape(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

export function blocklistRules(blocklist, blockPageUrl) {
  // Redirect main-frame navigations to the block page, carrying the original URL
  // in the hash so the page can offer "go back" and "proceed anyway".
  return blocklist.map((host, i) => ({
    id: RESERVED.BLOCK_START + i,
    priority: 2000,
    action: { type: "redirect", redirect: { regexSubstitution: `${blockPageUrl}#url=\\0` } },
    condition: {
      regexFilter: `^https?://([a-z0-9-]+\\.)*${reEscape(host)}(?::\\d+)?(?:[/?#].*)?$`,
      resourceTypes: ["main_frame"],
    },
  }));
}
