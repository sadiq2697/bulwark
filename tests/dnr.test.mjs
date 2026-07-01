import { test } from "node:test";
import assert from "node:assert/strict";
import { allowlistRules, blocklistRules, trackingRules, RESERVED } from "../src/background/dnr.js";

test("allowlist builds allowAllRequests rules", () => {
  const rules = allowlistRules(["example.com"]);
  assert.equal(rules.length, 1);
  assert.equal(rules[0].id, RESERVED.ALLOW_START);
  assert.equal(rules[0].action.type, "allowAllRequests");
  assert.ok(rules[0].condition.resourceTypes.includes("main_frame"));
  assert.ok(rules[0].condition.requestDomains.includes("example.com"));
});

test("blocklist redirects main_frame to block page", () => {
  const rules = blocklistRules(["news.com"], "chrome-extension://x/pages/blocked.html");
  assert.equal(rules[0].id, RESERVED.BLOCK_START);
  assert.equal(rules[0].action.type, "redirect");
  assert.equal(rules[0].condition.resourceTypes[0], "main_frame");
});

test("trackingRules includes only enabled toggles", () => {
  assert.deepEqual(trackingRules({ gpc: false, xclientdata: false }), []);
  const gpc = trackingRules({ gpc: true, xclientdata: false });
  assert.equal(gpc.length, 1);
  assert.equal(gpc[0].action.requestHeaders[0].header, "Sec-GPC");
  const both = trackingRules({ gpc: true, xclientdata: true });
  assert.equal(both.length, 2);
  assert.equal(both[1].action.requestHeaders[0].operation, "remove");
});
