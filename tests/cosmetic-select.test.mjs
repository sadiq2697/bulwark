import { test } from "node:test";
import assert from "node:assert/strict";
import { selectCosmetic } from "../src/content/cosmetic-select.js";

const ads = [{ selector: ".ad", domains: [] }, { selector: ".news-ad", domains: ["news.com"] }];
const cookies = [{ selector: ".cookie-banner", domains: [] }];

test("includes ad selectors only when cosmeticAds is on", () => {
  const on = selectCosmetic({ host: "other.com", cosmeticAds: true, cookies: false, ads, cookieList: cookies });
  assert.deepEqual(on, [".ad"]);
  const off = selectCosmetic({ host: "other.com", cosmeticAds: false, cookies: false, ads, cookieList: cookies });
  assert.deepEqual(off, []);
});

test("includes cookie selectors only when cookies is on", () => {
  const on = selectCosmetic({ host: "other.com", cosmeticAds: false, cookies: true, ads, cookieList: cookies });
  assert.deepEqual(on, [".cookie-banner"]);
});

test("host-scoped selectors only match their domain", () => {
  const onNews = selectCosmetic({ host: "news.com", cosmeticAds: true, cookies: false, ads, cookieList: cookies });
  assert.deepEqual(onNews.sort(), [".ad", ".news-ad"]);
  const onOther = selectCosmetic({ host: "other.com", cosmeticAds: true, cookies: false, ads, cookieList: cookies });
  assert.deepEqual(onOther, [".ad"]);
});

test("both lists combine when both on", () => {
  const both = selectCosmetic({ host: "x.com", cosmeticAds: true, cookies: true, ads, cookieList: cookies });
  assert.deepEqual(both.sort(), [".ad", ".cookie-banner"]);
});
