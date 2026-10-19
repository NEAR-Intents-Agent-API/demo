import type { StatusResponse } from "@near-intents-agent-api/sdk";
import { formatDisplay } from "@/lib/format/amount";
import { operationEvidence } from "./operation-evidence";

/** Provider statuses keep their meaning; only their tone and casing are mapped. */
export function statusTone(status: string): "ok" | "attention" | "blocked" | "neutral" {
  const value = status.toLowerCase();
  if (value.includes("fail") || value.includes("reject") || value.includes("error")) {
    return "blocked";
  }
  if (
    value.includes("refund") ||
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
  shield: "Make private",
  unshield: "Make public",
  swap: "Swap tokens",
  withdraw: "Withdraw funds",
  near_sign_message: "NEAR sign-in",
  near_transfer: "Send NEAR",
  near_call: "NEAR contract call",
  evm_sign_typed_data: "EVM typed data",
  evm_sign_message: "EVM message",
  evm_sign_transaction: "EVM transaction",
  solana_sign_message: "Solana message",
  solana_sign_transaction: "Solana transaction",
};

export function operationActionLabel(operation: StatusResponse): string {
  const details = (operation.details ?? {}) as Record<string, unknown>;
  // A native request names its method (`near_transfer`, `evm_sign_typed_data`, …), not an action.
  const action = String(
    operation.type === "native" ? operation.details.method : (details.action ?? operation.type),
  );
  const label = Object.hasOwn(ACTION_LABELS, action) ? ACTION_LABELS[action] : undefined;
  return label ?? humanize(action);
}

/** Who made the operation: the grant that authorised it, else the owner or a grant-free deposit. */
export function operationMadeBy(operation: StatusResponse): string {
  return operation.grant ? operation.grant.label : "Owner";
}

/** The amount and token the provider echoed back, in token units; null when it did not. */
export function operationAmountLabel(
  operation: StatusResponse,
  find: (asset: string) => { symbol: string; decimals: number } | undefined,
): string | null {
  const { token, amount } = operationEvidence(operation);
  if (!token || !amount || !/^[0-9]{1,78}$/.test(amount)) return null;
  const known = find(token);
  return known ? `${formatDisplay(amount, known.decimals)} ${known.symbol}` : null;
}
