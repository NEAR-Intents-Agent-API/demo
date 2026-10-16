import type { AgentApiError } from "@near-intents-agent-api/sdk";

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
  /** JSON pointer to the signed field a mismatch refusal is about (the API's `source.pointer`). */
  pointer?: string;
};

const usdPattern = /^\d{1,12}(\.\d{1,18})?$/;

/**
 * The pointers the API names on owner, signer and policy-delegate mismatches. Only these shapes
 * are forwarded: a pointer is a field name, never a value, but an unexpected one could still carry
 * request text.
 */
const pointerPattern =
  /^\/signed_data\/(public_key|credential\/id|payload\/message\/(tenant_id|agent_id|network|recipient|account_id|public_key|previous_public_key|owner)|signed_delegate\/(sender_id|public_key|receiver_id|actions|actions\/\d{1,3}\/(receiver_id|method_name|deposit|gas|args)))$/;

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
  const pointer = source.pointer;
  if (typeof pointer === "string" && pointerPattern.test(pointer)) details.pointer = pointer;
  return details;
}

/** The facts an Agent API refusal carries: its retry time and the field its first error names. */
export function agentApiErrorDetails(error: AgentApiError): ErrorDetails {
  return errorDetails({
    available_at: error.availableAt,
    pointer: error.errors[0]?.source?.pointer,
  });
}
