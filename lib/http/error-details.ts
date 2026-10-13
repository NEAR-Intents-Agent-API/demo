/**
 * Non-secret facts that explain an API refusal, forwarded from the BFF to the browser.
 *
 * Only these fields ever cross the wire: raw provider text, API `detail` strings, keys and tokens
 * are never forwarded. Snake_case matches the Agent API and the MCP tool errors.
 */
export type ErrorDetails = {
  /** ISO time the same request can be sent again (throttles, quotas, schedule windows). */
  available_at?: string;
  /** USD left in the tightest budget window, as a plain decimal string. */
  budget_remaining_usd?: string;
};

const usdPattern = /^\d{1,12}(\.\d{1,18})?$/;

/** Keeps the allowlisted fields that are well-formed; anything else is dropped. */
export function errorDetails(input: unknown): ErrorDetails {
  if (typeof input !== "object" || input === null) return {};
  const source = input as Record<string, unknown>;
  const details: ErrorDetails = {};
  const availableAt = source.available_at;
  if (
    typeof availableAt === "string" &&
    availableAt.length <= 40 &&
    !Number.isNaN(Date.parse(availableAt))
  )
    details.available_at = availableAt;
  const remaining = source.budget_remaining_usd;
  if (typeof remaining === "string" && usdPattern.test(remaining))
    details.budget_remaining_usd = remaining;
  return details;
}
