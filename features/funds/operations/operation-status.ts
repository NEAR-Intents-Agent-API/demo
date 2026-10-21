/**
 * One status → one phase bar position, one tone, one sentence. Provider statuses are not ours to
 * rename, so this is the only place they are interpreted; everything else renders the result.
 */

import { accountTimestamp } from "@/lib/format/date";
import { errorMessage } from "@/lib/http/messages";
import { evidenceAmount } from "./operation-evidence";

export type OperationTone = "run" | "ok" | "wait" | "bad";

export type OperationView = {
  reached: 1 | 2 | 3;
  tone: OperationTone;
  line: string;
};

/** Statuses where repeating the request could send funds twice: never invite another try. */
export const UNRESOLVED_STATUSES = new Set(["UNCERTAIN", "NEEDS_REVIEW"]);

export const TERMINAL_STATUSES = new Set(["SUCCESS", "FAILED", "REFUNDED"]);

export const PHASES = ["Submitted", "Processing", "Settled"] as const;

/** The facts a failure line may name beyond its code. */
export type FailureFacts = {
  /** `details.min_amount`: the route minimum in atomic units of the asset sent. */
  minAmount?: string | null;
  /** The asset sent, so the minimum reads in its units. */
  token?: { symbol: string; decimals: number } | null;
};

/**
 * One sentence for a failure code. An `amount_too_low` refusal names the route minimum when the
 * API recorded it; every other code reads from the shared message table.
 */
export function failureReason(failureCode: string, facts: FailureFacts = {}): string {
  const minimum = facts.minAmount;
  if (failureCode === "amount_too_low" && minimum && /^[0-9]{1,78}$/.test(minimum))
    return `This amount is below the minimum for this route, ${evidenceAmount(minimum, facts.token)}. Send at least that.`;
  return errorMessage(failureCode);
}

export function describeOperation(
  status: string,
  options: {
    executeAfter?: string | null;
    /** The API's snake_case reason for a FAILED move. */
    failureCode?: string | null;
    /** A transaction hash is recorded, so something was submitted before it failed. */
    hasTransaction?: boolean;
  } & FailureFacts = {},
): OperationView {
  switch (status) {
    case "SUCCESS":
      return { reached: 3, tone: "ok", line: "Done. The move settled." };
    case "REFUNDED":
      return {
        reached: 3,
        tone: "bad",
        line: "The route refunded your funds to the account. Nothing was lost.",
      };
    case "FAILED":
      // The API's FAILED is "provably never executed, or failed with a recorded reason": say so,
      // and only point at the balances when a transaction was recorded.
      return {
        reached: 2,
        tone: "bad",
        line: failedLine(options.failureCode, options.hasTransaction, options),
      };
    case "UNCERTAIN":
      return {
        reached: 2,
        tone: "wait",
        line: "The outcome is not known yet. Do not repeat it: a second try could send the funds twice. This page keeps checking.",
      };
    case "NEEDS_REVIEW":
      return {
        reached: 2,
        tone: "wait",
        line: "The provider is reviewing this move. Do not repeat it: a second try could send the funds twice. Check again after the review.",
      };
    case "QUEUED":
      return {
        reached: 1,
        tone: "wait",
        line: `Held by your execution delay${
          options.executeAfter ? `, runs ${accountTimestamp(options.executeAfter)}` : ""
        }. Nothing has been sent yet. You can cancel it in Rules until then.`,
      };
    case "PENDING_APPROVAL":
      return {
        reached: 1,
        tone: "wait",
        line: "Waiting for your approval before it can run. Approve or reject it in Activity.",
      };
    case "PENDING_DEPOSIT":
      return {
        reached: 1,
        tone: "wait",
        line: "Waiting for your deposit. Send it to the address below.",
      };
    default:
      return { reached: 2, tone: "run", line: "Working on it. This usually takes under a minute." };
  }
}

function failedLine(
  failureCode: string | null | undefined,
  hasTransaction: boolean | undefined,
  facts: FailureFacts,
): string {
  const line = failureCode
    ? `This move did not go through: ${failureReason(failureCode, facts)}`
    : "This move did not go through.";
  return hasTransaction
    ? `${line} A transaction was recorded for it (below), so check your balances before trying again.`
    : line;
}
