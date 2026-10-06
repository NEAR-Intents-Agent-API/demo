const date = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });
const timestamp = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

/** Server and browser render the same account timestamps regardless of local timezone. */
export function accountDate(value: string): string {
  return date.format(new Date(value));
}

export function accountTimestamp(value: string): string {
  return `${timestamp.format(new Date(value))} UTC`;
}
