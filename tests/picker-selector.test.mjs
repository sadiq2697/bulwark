import { test } from "node:test";
import assert from "node:assert/strict";
import { generateSelector } from "../src/content/selector.js";

function el({ id = "", classes = [], tag = "DIV" }) {
  return { id, tagName: tag, classList: classes };
}

test("prefers id", () => {
  assert.equal(generateSelector(el({ id: "hero", tag: "SECTION" })), "#hero");
});

test("uses tag and classes when no id", () => {
  const s = generateSelector(el({ tag: "DIV", classes: ["ad", "banner"] }));
  assert.equal(s, "div.ad.banner");
});

test("drops hashed/generated classes", () => {
  const s = generateSelector(el({ tag: "DIV", classes: ["css12345", "promo"] }));
  assert.equal(s, "div.promo");
});
