import type { ScheduledExecutionView } from "@near-intents-agent-api/sdk";

/** The scheduled action in the owner's words; the API names it by its internal action. */
const ACTION_LABELS: Readonly<Record<string, string>> = {
  swap: "Swap",
  intents_transfer: "Transfer",
  confidential_transfer: "Private transfer",
  withdraw: "Withdrawal",
  shield: "Move to private balance",
  unshield: "Move to public balance",
};

export const scheduledActionLabel = (action: string | null) =>
  (action && Object.hasOwn(ACTION_LABELS, action) ? ACTION_LABELS[action] : undefined) ??
  "Money action";

/** When a waiting execution runs; once that moment has passed it is about to be released. */
export function scheduledTiming(item: ScheduledExecutionView, now = Date.now()): string {
  if (item.state !== "waiting") return "Running now. It can no longer be cancelled.";
  const at = Date.parse(item.execute_after);
  return at > now
    ? `Runs ${new Date(at).toLocaleString()}`
    : "Due now. It runs as soon as the schedule allows.";
}
