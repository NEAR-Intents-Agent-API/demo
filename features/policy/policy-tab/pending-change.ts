import type { Policy } from "@near-intents-agent-api/sdk";
import type { IntentStep } from "@/features/intents";
import { terminalStatuses } from "@/lib/agent-api/schemas";

/**
 * The rules change the owner started earlier and has not finished, judged against the rules
 * the browser shows now.
 *
 * - `signable`: prepared, never signed, still on the current revision. Signing it installs
 *   exactly `policy`; it is only ever signed when the owner asks to save that same policy.
 * - `in_flight`: signed or otherwise past the signature. It is observed, never signed again,
 *   and no new change starts until it settles. `needsReview` marks an outcome nobody knows yet.
 */
export type PendingChange =
  | { kind: "none" }
  | { kind: "signable"; step: IntentStep; policy: Policy }
  | { kind: "in_flight"; step: IntentStep; needsReview: boolean };

export function pendingChange(
  saved: IntentStep | null | undefined,
  revision: number | null,
  now = Date.now(),
): PendingChange {
  if (!saved) return { kind: "none" };
  const { status } = saved.operation;
  if (terminalStatuses.includes(status)) return { kind: "none" };
  if (status !== "PENDING_SIGNATURE")
    return {
      kind: "in_flight",
      step: saved,
      needsReview: status === "UNCERTAIN" || status === "NEEDS_REVIEW",
    };
  const { preview, expires_at: expiresAt } = saved.generated;
  // An expired or outdated request can never be signed; the owner just starts a new change.
  if (
    Date.parse(expiresAt) <= now ||
    preview.previous_revision !== (revision ?? 0) ||
    !preview.policy
  )
    return { kind: "none" };
  return { kind: "signable", step: saved, policy: preview.policy };
}

/** Key order must not make two equal policies look different. */
function stable(value: unknown): string {
  return JSON.stringify(value, (_key, item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)))
      : item,
  );
}

export const samePolicy = (a: Policy, b: Policy) => stable(a) === stable(b);
