/**
 * One status → one phase bar position, one tone, one sentence. Provider statuses are not ours to
 * rename, so this is the only place they are interpreted; everything else renders the result.
 */

export type OperationTone = "run" | "ok" | "wait" | "bad";

export type OperationView = {
  reached: 1 | 2 | 3;
  tone: OperationTone;
  line: string;
};

export const TERMINAL_STATUSES = new Set(["SUCCESS", "FAILED", "REFUNDED"]);

export const PHASES = ["Submitted", "Processing", "Settled"] as const;

export function describeOperation(status: string): OperationView {
  switch (status) {
    case "SUCCESS":
      return { reached: 3, tone: "ok", line: "Done. The move settled." };
    case "REFUNDED":
      return { reached: 3, tone: "bad", line: "The route refunded your funds. Nothing was lost." };
    case "FAILED":
      return { reached: 2, tone: "bad", line: "This move did not go through." };
    case "UNCERTAIN":
      return {
        reached: 2,
        tone: "wait",
        line: "The outcome is not known yet. Do not repeat it — this page keeps checking.",
      };
    case "NEEDS_REVIEW":
      return {
        reached: 2,
        tone: "wait",
        line: "Provider review required. Do not repeat this move. Check again after review.",
      };
    case "QUEUED":
      return {
        reached: 1,
        tone: "wait",
        line: "Waiting out your execution delay. You can cancel it in Rules.",
      };
    case "PENDING_APPROVAL":
      return { reached: 1, tone: "wait", line: "Waiting for a second approval before it can run." };
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
