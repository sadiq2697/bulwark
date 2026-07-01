import { test } from "node:test";
import assert from "node:assert/strict";
import { allowlistRules, blocklistRules, RESERVED } from "../src/background/dnr.js";

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
