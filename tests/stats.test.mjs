import { test } from "node:test";
import assert from "node:assert/strict";
import { summarize, categoryFor, dayKey, pruneDays } from "../src/lib/stats.js";

test("categoryFor maps ruleset ids", () => {
  assert.equal(categoryFor("ads"), "ads");
  assert.equal(categoryFor("privacy"), "trackers");
  assert.equal(categoryFor("custom"), "other");
  assert.equal(categoryFor(undefined), "other");
});

test("dayKey formats local date", () => {
  assert.equal(dayKey(new Date(2026, 6, 1)), "2026-07-01");
  assert.equal(dayKey(new Date(2026, 0, 9)), "2026-01-09");
});

test("summarize returns n zero-filled days ending today, oldest first", () => {
  const days = { "2026-07-01": { ads: 3, trackers: 2, other: 1 }, "2026-06-30": { ads: 5 } };
  const { last, totals } = summarize(days, "2026-07-01", 7);
  assert.equal(last.length, 7);
  assert.equal(last[6].day, "2026-07-01");
  assert.equal(last[6].total, 6);
  assert.equal(last[5].day, "2026-06-30");
  assert.equal(last[5].total, 5);
  assert.equal(last[0].total, 0); // gap day zero-filled
  assert.deepEqual(totals, { ads: 8, trackers: 2, other: 1, total: 11 });
});

test("pruneDays drops buckets older than keep window", () => {
  const days = { "2026-07-01": { ads: 1 }, "2026-05-01": { ads: 9 } };
  const kept = pruneDays(days, "2026-07-01", 30);
  assert.ok(kept["2026-07-01"]);
  assert.equal(kept["2026-05-01"], undefined);
});
