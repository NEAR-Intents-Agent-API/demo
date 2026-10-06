import type { StatusResponse } from "@near-intents-agent-api/sdk";

/** Provider statuses keep their meaning; only their tone and casing are mapped. */
export function statusTone(status: string): "ok" | "attention" | "blocked" | "neutral" {
  const value = status.toLowerCase();
  if (value.includes("fail") || value.includes("reject") || value.includes("error")) {
    return "blocked";
  }
  if (
    value.includes("pending") ||
    value.includes("uncertain") ||
    value.includes("review") ||
    value.includes("approval")
  ) {
    return "attention";
  }
  if (value.includes("complete") || value.includes("success") || value.includes("settled")) {
    return "ok";
  }
  return "neutral";
}

export function humanize(value: string): string {
  return value.replaceAll("_", " ").toLowerCase();
}

const ACTION_LABELS: Readonly<Record<string, string>> = {
  agent_create: "Create account",
  policy_update: "Update rules",
  agent_freeze: "Freeze account",
  agent_unfreeze: "Unfreeze account",
  agent_archive: "Archive account",
  agent_restore: "Restore account",
  agent_delete: "Delete account",
  grant_issue: "Authorize access",
  grant_revoke: "Revoke access",
  execution_cancel: "Cancel operation",
  approval_vote: "Approval decision",
  intents_transfer: "Transfer funds",
  confidential_transfer: "Private transfer",
  cross_chain_deposit: "Deposit funds",
  shield: "Make funds private",
  unshield: "Make funds public",
  swap: "Swap tokens",
  withdraw: "Withdraw funds",
};

export function operationActionLabel(operation: StatusResponse): string {
  const details = (operation.details ?? {}) as Record<string, unknown>;
  const action = String(details.action ?? operation.type);
  const label = Object.hasOwn(ACTION_LABELS, action) ? ACTION_LABELS[action] : undefined;
  return label ?? humanize(action);
}

export function operationTransactionHash(operation: StatusResponse): string | null {
  const details = (operation.details ?? {}) as Record<string, unknown>;
  return (
    [details.transaction_hash, details.tx_hash].find(
      (value): value is string => typeof value === "string" && value.length > 0,
    ) ?? null
  );
}
