import { test } from "node:test";
import assert from "node:assert/strict";
import { isWithinWindow, parseHM } from "../src/background/schedule.js";

const sched = { enabled: true, days: [1, 2, 3, 4, 5], start: "09:00", end: "17:00" };

test("parseHM", () => { assert.equal(parseHM("09:30"), 570); });

test("inside window on a weekday", () => {
  const d = new Date("2026-07-01T10:00:00"); // Wednesday
  assert.equal(isWithinWindow(sched, d), true);
});

test("outside window (evening)", () => {
  const d = new Date("2026-07-01T18:00:00");
  assert.equal(isWithinWindow(sched, d), false);
});

test("disabled schedule is never within", () => {
  const d = new Date("2026-07-01T10:00:00");
  assert.equal(isWithinWindow({ ...sched, enabled: false }, d), false);
});

test("weekend excluded", () => {
  const d = new Date("2026-07-04T10:00:00"); // Saturday
  assert.equal(isWithinWindow(sched, d), false);
});
