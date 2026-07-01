export const RESERVED = { ALLOW_START: 1000000, BLOCK_START: 2000000, CUSTOM_START: 3000000 };

export function allowlistRules(allowlist) {
  return allowlist.map((host, i) => ({
    id: RESERVED.ALLOW_START + i,
    priority: 1000,
    action: { type: "allowAllRequests" },
    condition: { requestDomains: [host], resourceTypes: ["main_frame", "sub_frame"] },
  }));
}

export function blocklistRules(blocklist, blockPageUrl) {
  return blocklist.map((host, i) => ({
    id: RESERVED.BLOCK_START + i,
    priority: 2000,
    action: { type: "redirect", redirect: { url: blockPageUrl } },
    condition: { requestDomains: [host], resourceTypes: ["main_frame"] },
  }));
}
