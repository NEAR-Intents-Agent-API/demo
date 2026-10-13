/** What the Agent API recorded about an operation's money, as plain optional strings. */
export type OperationEvidence = {
  txHash: string | null;
  destinationTxHash: string | null;
  depositTxHash: string | null;
  refundTxHash: string | null;
  refundTo: string | null;
  /** Atomic units of the refunded asset. */
  refundedAmount: string | null;
  /** When a queued operation is released, ISO time. */
  executeAfter: string | null;
  failureReason: string | null;
  /** The asset and atomic amount the provider echoed back, when it did. */
  token: string | null;
  amount: string | null;
};

function text(details: Record<string, unknown>, key: string): string | null {
  const value = details[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** Reads the wire's snake_case evidence; `tx_hash` is the move, `destination_tx_hash` the landing. */
export function operationEvidence(
  operation: { details?: unknown } | null | undefined,
): OperationEvidence {
  const details = (operation?.details ?? {}) as Record<string, unknown>;
  return {
    txHash: text(details, "tx_hash"),
    destinationTxHash: text(details, "destination_tx_hash"),
    depositTxHash: text(details, "deposit_tx_hash"),
    refundTxHash: text(details, "refund_tx_hash"),
    refundTo: text(details, "refund_to"),
    refundedAmount: text(details, "refunded_amount"),
    executeAfter: text(details, "execute_after"),
    failureReason: text(details, "failure_reason"),
    token: text(details, "token"),
    amount: text(details, "amount"),
  };
}
