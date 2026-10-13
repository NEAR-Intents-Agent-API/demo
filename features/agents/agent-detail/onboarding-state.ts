import type { IntentStep } from "@/features/intents";

/**
 * Where an account's activation request stands, in the only terms the owner can act on.
 *
 * - `sign`: prepared, unsigned, still valid. The wallet prompt may open.
 * - `confirming`: signed; it is only observed, never signed again.
 * - `review`: signed, outcome unknown (UNCERTAIN or NEEDS_REVIEW); observed, never re-signed.
 * - `expired`: it can never go live. An unsigned request past its deadline, or one that failed.
 *   The only way forward is a fresh request, which makes a new account.
 * - `done`: the account is live.
 */
export type OnboardingState = "sign" | "confirming" | "review" | "expired" | "done";

export function onboardingState(step: IntentStep, now = Date.now()): OnboardingState {
  const { status } = step.operation;
  if (status === "SUCCESS") return "done";
  if (status === "FAILED" || status === "REFUNDED") return "expired";
  if (status === "PENDING_SIGNATURE")
    return Date.parse(step.generated.expires_at) > now ? "sign" : "expired";
  return status === "UNCERTAIN" || status === "NEEDS_REVIEW" ? "review" : "confirming";
}
