import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveTheme } from "../src/lib/theme.js";

test("explicit preferences pass through", () => {
  assert.equal(resolveTheme("dark", false), "dark");
  assert.equal(resolveTheme("light", true), "light");
});

test("system follows the OS preference", () => {
  assert.equal(resolveTheme("system", true), "dark");
  assert.equal(resolveTheme("system", false), "light");
});
