export type LogLevel = "debug" | "info" | "warn" | "error";

const levelRank: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function configuredLevel(): LogLevel {
  const value = (process.env.DEMO_LOG_LEVEL ?? "").toLowerCase();
  if (value in levelRank) return value as LogLevel;
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

export type LogFields = Record<string, unknown>;

/** One JSON line per event; every request carries a request id shared with the Agent API call. */
export function log(level: LogLevel, event: string, fields: LogFields = {}): void {
  if (levelRank[level] < levelRank[configuredLevel()]) return;
  const line = { level, time: new Date().toISOString(), app: "demo", event, ...fields };
  const write = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  write(JSON.stringify(line));
}

export const logger = {
  debug: (event: string, fields?: LogFields) => log("debug", event, fields),
  info: (event: string, fields?: LogFields) => log("info", event, fields),
  warn: (event: string, fields?: LogFields) => log("warn", event, fields),
  error: (event: string, fields?: LogFields) => log("error", event, fields),
};

export function errorFields(error: unknown): LogFields {
  return { error_kind: error instanceof Error ? "exception" : "thrown_value" };
}
