import type { Schedule, ScheduleDay, ScheduleWindow } from "@near-intents-agent-api/sdk";

/**
 * The account's `policy.schedule`: weekly windows on the owner's clock when money actions may run
 * (`only`) or are paused (`except`). The API enforces it when an action would run (after the
 * execution delay); these helpers only shape the editor and preview it.
 */

export type ScheduleMode = "off" | Schedule["mode"];

/** Display order, Monday first. */
export const SCHEDULE_DAYS: readonly { day: ScheduleDay; label: string }[] = [
  { day: "mon", label: "Mon" },
  { day: "tue", label: "Tue" },
  { day: "wed", label: "Wed" },
  { day: "thu", label: "Thu" },
  { day: "fri", label: "Fri" },
  { day: "sat", label: "Sat" },
  { day: "sun", label: "Sun" },
];
const WEEKDAYS: ScheduleDay[] = ["mon", "tue", "wed", "thu", "fri"];
const EVERY_DAY: ScheduleDay[] = SCHEDULE_DAYS.map(({ day }) => day);
/** `Intl` weekday order, Sunday first. */
const INTL_DAYS: readonly ScheduleDay[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export const SCHEDULE_MODE_COPY: Record<ScheduleMode, string> = {
  off: "Any time",
  only: "Only during these windows",
  except: "Paused during these windows",
};

export const SCHEDULE_PRESETS: readonly {
  label: string;
  mode: Schedule["mode"];
  windows: ScheduleWindow[];
}[] = [
  {
    label: "Weekdays 9–17",
    mode: "only",
    windows: [{ days: WEEKDAYS, start: "09:00", end: "17:00" }],
  },
  {
    label: "Weekends only",
    mode: "only",
    windows: [{ days: ["sat", "sun"], start: "00:00", end: "24:00" }],
  },
  {
    label: "Pause overnight",
    mode: "except",
    windows: [{ days: EVERY_DAY, start: "22:00", end: "07:00" }],
  },
];

export const MAX_SCHEDULE_WINDOWS = 28;

export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** Every IANA zone the browser knows, with UTC first. */
export function timeZoneOptions(current: string): string[] {
  const zones =
    typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
  return [...new Set(["UTC", current, ...zones])];
}

export function newWindow(): ScheduleWindow {
  return { days: [...WEEKDAYS], start: "09:00", end: "17:00" };
}

/** The schedule a mode switch produces, keeping windows the owner already drew. */
export function scheduleForMode(current: Schedule | null, mode: ScheduleMode): Schedule | null {
  if (mode === "off") return null;
  if (current) return { ...current, mode };
  return { mode, time_zone: browserTimeZone(), windows: [newWindow()] };
}

function minuteOfDay(clock: string) {
  const [hours, minutes] = clock.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

/** An end at or before the start runs past midnight and belongs to the day it starts on. */
export function crossesMidnight(window: ScheduleWindow) {
  return Boolean(window.start && window.end) && minuteOfDay(window.end) < minuteOfDay(window.start);
}

function covers(window: ScheduleWindow, day: ScheduleDay, minute: number) {
  const start = minuteOfDay(window.start);
  const end = minuteOfDay(window.end);
  if (start < end) return window.days.includes(day) && minute >= start && minute < end;
  const previous = INTL_DAYS[(INTL_DAYS.indexOf(day) + 6) % 7] as ScheduleDay;
  return (
    (window.days.includes(day) && minute >= start) ||
    (window.days.includes(previous) && minute < end)
  );
}

/** The owner's wall clock now, and whether the schedule lets money actions run. */
export function schedulePreview(schedule: Schedule, at = new Date()) {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: schedule.time_zone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(at);
  } catch {
    return null;
  }
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((value) => value.type === type)?.value ?? "";
  const day = INTL_DAYS[["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(part("weekday"))];
  if (!day) return null;
  const clock = `${part("hour")}:${part("minute")}`;
  const inside = schedule.windows.some((window) => covers(window, day, minuteOfDay(clock)));
  return {
    clock: `${part("weekday")} ${clock}`,
    open: schedule.mode === "only" ? inside : !inside,
  };
}

function describeDays(days: ScheduleDay[]) {
  const ordered = SCHEDULE_DAYS.filter(({ day }) => days.includes(day));
  const key = ordered.map(({ day }) => day).join(",");
  if (ordered.length === 7) return "Every day";
  if (key === WEEKDAYS.join(",")) return "Mon–Fri";
  if (key === "sat,sun") return "Sat–Sun";
  return ordered.map(({ label }) => label).join(", ");
}

export function describeWindow(window: ScheduleWindow) {
  const hours =
    window.start === "00:00" && window.end === "24:00"
      ? "all day"
      : `${window.start}–${window.end}`;
  return `${describeDays(window.days)} ${hours}`;
}

/** One line for summaries: "Only Mon–Fri 09:00–17:00 · Europe/Berlin". */
export function describeSchedule(schedule: Schedule | null) {
  if (!schedule) return "Any time";
  const verb = schedule.mode === "only" ? "Only" : "Paused";
  return `${verb} ${schedule.windows.map(describeWindow).join("; ")} · ${schedule.time_zone}`;
}
