import { grantExpiryProblem, grantLabelProblem } from "@/lib/agent-api/access-input";

export type AccessPreset = 1 | 7 | 30;
export type AccessDuration = AccessPreset | "custom";

export const ACCESS_DURATIONS = [
  { value: 1, label: "24 hours" },
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: "custom", label: "Custom" },
] as const;

export const DEFAULT_ACCESS_LABEL = "Dashboard";

const DAY_MS = 24 * 60 * 60 * 1000;

/** The instant the access would end, in epoch milliseconds; NaN when a custom date is empty. */
export function accessExpiryMs(duration: AccessDuration, custom: string, now: number): number {
  return duration === "custom" ? Date.parse(custom) : now + duration * DAY_MS;
}

export type AccessProblems = { label: string | null; expiry: string | null };

/** Reasons the form cannot be signed yet; both null when it can. */
export function accessProblems(
  input: { label: string; duration: AccessDuration; custom: string },
  now: number,
): AccessProblems {
  return {
    label: grantLabelProblem(input.label),
    expiry: grantExpiryProblem(accessExpiryMs(input.duration, input.custom, now), now),
  };
}

/** `<input type="datetime-local">` value for an instant, in the owner's time zone. */
export function localDateTimeValue(ms: number): string {
  const date = new Date(ms - new Date(ms).getTimezoneOffset() * 60 * 1000);
  return date.toISOString().slice(0, 16);
}
