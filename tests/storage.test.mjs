import { test } from "node:test";
import assert from "node:assert/strict";
import { installChromeMock } from "./helpers/chrome-mock.mjs";

test("getSettings returns defaults when empty", async () => {
  installChromeMock();
  const { getSettings } = await import("../src/lib/storage.js");
  const s = await getSettings();
  assert.equal(s.enabled, true);
  assert.deepEqual(s.allowlist, []);
  assert.equal(s.rulesets.ads, true);
});

test("setSettings merges and persists", async () => {
  installChromeMock();
  const { setSettings, getSettings } = await import("../src/lib/storage.js");
  await setSettings({ allowlist: ["example.com"] });
  const s = await getSettings();
  assert.deepEqual(s.allowlist, ["example.com"]);
  assert.equal(s.enabled, true);
});
