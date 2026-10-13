/**
 * One status → one phase bar position, one tone, one sentence. Provider statuses are not ours to
 * rename, so this is the only place they are interpreted; everything else renders the result.
 */

import { accountTimestamp } from "@/lib/format/date";

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

export function describeOperation(
  status: string,
  options: { executeAfter?: string | null } = {},
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
      return {
        reached: 2,
        tone: "bad",
        line: "This move stopped before it finished. Part of it may have gone through, so check your balances and the transactions below before trying again.",
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
