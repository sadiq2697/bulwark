import { test } from "node:test";
import assert from "node:assert/strict";
import { selectCosmetic } from "../src/content/cosmetic-select.js";

const ads = [{ selector: ".ad", domains: [] }, { selector: ".news-ad", domains: ["news.com"] }];
const cookies = [{ selector: ".cookie-banner", domains: [] }];

test("generic selectors apply everywhere", () => {
  assert.deepEqual(selectCosmetic("other.com", [ads]), [".ad"]);
});

test("host-scoped selectors only match their domain", () => {
  assert.deepEqual(selectCosmetic("news.com", [ads]).sort(), [".ad", ".news-ad"]);
  assert.deepEqual(selectCosmetic("other.com", [ads]), [".ad"]);
});

test("combines multiple lists", () => {
  assert.deepEqual(selectCosmetic("x.com", [ads, cookies]).sort(), [".ad", ".cookie-banner"]);
});

test("no lists yields nothing", () => {
  assert.deepEqual(selectCosmetic("x.com", []), []);
});
