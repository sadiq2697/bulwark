import { test } from "node:test";
import assert from "node:assert/strict";
import { allowlistRules, blocklistRules, trackingRules, trackingParamRule, RESERVED } from "../src/background/dnr.js";

test("allowlist builds allowAllRequests rules", () => {
  const rules = allowlistRules(["example.com"]);
  assert.equal(rules.length, 1);
  assert.equal(rules[0].id, RESERVED.ALLOW_START);
  assert.equal(rules[0].action.type, "allowAllRequests");
  assert.ok(rules[0].condition.resourceTypes.includes("main_frame"));
  assert.ok(rules[0].condition.requestDomains.includes("example.com"));
});

test("blocklist redirects main_frame to block page with original url", () => {
  const rules = blocklistRules(["news.com"], "chrome-extension://x/pages/blocked.html");
  assert.equal(rules[0].id, RESERVED.BLOCK_START);
  assert.equal(rules[0].action.type, "redirect");
  assert.ok(rules[0].action.redirect.regexSubstitution.includes("blocked.html"));
  assert.ok(rules[0].action.redirect.regexSubstitution.includes("#url="));
  assert.ok(rules[0].condition.regexFilter.includes("news"));
  assert.equal(rules[0].condition.resourceTypes[0], "main_frame");
});

test("trackingRules includes only enabled toggles", () => {
  assert.deepEqual(trackingRules({ gpc: false, xclientdata: false, urlparams: false }), []);
  const gpc = trackingRules({ gpc: true, xclientdata: false, urlparams: false });
  assert.equal(gpc.length, 1);
  assert.equal(gpc[0].action.requestHeaders[0].header, "Sec-GPC");
  const all = trackingRules({ gpc: true, xclientdata: true, urlparams: true });
  assert.equal(all.length, 3);
  assert.equal(all[1].action.requestHeaders[0].operation, "remove");
});

test("trackingParamRule strips params and avoids loops via regexFilter", () => {
  const r = trackingParamRule(42);
  const params = r.action.redirect.transform.queryTransform.removeParams;
  assert.ok(params.includes("utm_source") && params.includes("fbclid") && params.includes("gclid"));
  assert.ok(r.condition.regexFilter.includes("fbclid"));
  assert.ok(r.condition.resourceTypes.includes("main_frame"));
});
