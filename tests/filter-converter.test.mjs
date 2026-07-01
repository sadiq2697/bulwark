import { test } from "node:test";
import assert from "node:assert/strict";
import { convertNetworkRule, extractCosmetic, convertList } from "../src/lib/filter-converter.js";

test("comments and blanks return null", () => {
  assert.equal(convertNetworkRule("! comment", 1), null);
  assert.equal(convertNetworkRule("", 1), null);
  assert.equal(convertNetworkRule("[Adblock Plus 2.0]", 1), null);
});

test("domain anchor block rule", () => {
  const { rule } = convertNetworkRule("||doubleclick.net^", 5);
  assert.equal(rule.id, 5);
  assert.equal(rule.action.type, "block");
  assert.equal(rule.condition.urlFilter, "||doubleclick.net^");
});

test("exception becomes allow rule with higher priority", () => {
  const { rule } = convertNetworkRule("@@||example.com^", 6);
  assert.equal(rule.action.type, "allow");
  assert.ok(rule.priority > 1);
});

test("type options map to resourceTypes", () => {
  const { rule } = convertNetworkRule("||ads.example^$script,image", 7);
  assert.deepEqual(rule.condition.resourceTypes.sort(), ["image", "script"]);
});

test("regex rules are skipped", () => {
  assert.deepEqual(convertNetworkRule("/banner\\d+/", 8), { skipped: "/banner\\d+/" });
});

test("cosmetic hide rule", () => {
  assert.deepEqual(extractCosmetic("example.com##.ad-banner"), { selector: ".ad-banner", domains: ["example.com"] });
  assert.deepEqual(extractCosmetic("##.generic-ad"), { selector: ".generic-ad", domains: [] });
});

test("convertList aggregates", () => {
  const text = "! c\n||a.net^\nexample.com##.x\n/re/\n";
  const out = convertList(text, 1);
  assert.equal(out.rules.length, 1);
  assert.equal(out.cosmetic.length, 1);
  assert.equal(out.skipped, 1);
});
