import assert from "node:assert/strict";
import { test } from "node:test";
import type { Schedule } from "@near-intents-agent-api/sdk";
import {
  crossesMidnight,
  describeSchedule,
  scheduleForMode,
  schedulePreview,
} from "../../features/policy/rules/schedule";

// 2026-10-09 is a Friday.
const nightPause: Schedule = {
  mode: "except",
  time_zone: "UTC",
  windows: [{ days: ["fri"], start: "22:00", end: "06:00" }],
};

test("the preview reads the owner's clock and a window past midnight belongs to its start day", () => {
  assert.deepEqual(schedulePreview(nightPause, new Date("2026-10-09T23:30:00Z")), {
    clock: "Fri 23:30",
    open: false,
  });
  assert.equal(schedulePreview(nightPause, new Date("2026-10-10T05:59:00Z"))?.open, false);
  assert.equal(schedulePreview(nightPause, new Date("2026-10-10T06:00:00Z"))?.open, true);
  assert.equal(schedulePreview(nightPause, new Date("2026-10-09T03:00:00Z"))?.open, true);
  assert.equal(crossesMidnight({ days: ["fri"], start: "22:00", end: "06:00" }), true);
  const berlin: Schedule = {
    mode: "only",
    time_zone: "Europe/Berlin",
    windows: [{ days: ["fri"], start: "17:00", end: "24:00" }],
  };
  // CEST, UTC+2.
  assert.equal(schedulePreview(berlin, new Date("2026-10-09T15:00:00Z"))?.open, true);
  assert.equal(schedulePreview(berlin, new Date("2026-10-09T14:59:00Z"))?.open, false);
});

test("switching modes keeps the windows, and any time clears the schedule", () => {
  assert.deepEqual(scheduleForMode(nightPause, "only"), { ...nightPause, mode: "only" });
  assert.equal(scheduleForMode(nightPause, "off"), null);
  assert.equal(scheduleForMode(null, "except")?.windows.length, 1);
  assert.equal(describeSchedule(nightPause), "Paused Fri 22:00–06:00 · UTC");
  assert.equal(describeSchedule(null), "Any time");
});
