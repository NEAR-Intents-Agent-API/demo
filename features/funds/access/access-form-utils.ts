export type AccessDuration = 1 | 7 | 30;

export const ACCESS_DURATIONS = [
  { value: 1, label: "24 hours" },
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
] as const;
