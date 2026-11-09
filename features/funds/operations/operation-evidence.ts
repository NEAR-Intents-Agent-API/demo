import { formatDisplay } from "@/lib/format/amount";

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
  /** The route minimum in atomic units of the asset sent: a deposit's floor, or why a move was too low. */
  minAmount: string | null;
  /** Limit orders: the provider's id for the funded, resting order; null until it is placed. */
  orderId: string | null;
  /** Limit orders: the order as admitted, null for every other operation. */
  limitOrder: LimitOrderTerms | null;
};

/** A limit order's terms as the request recorded them; `quantity` is atomic units of the base asset. */
export type LimitOrderTerms = {
  side: "sell" | "buy";
  baseAsset: string;
  quoteAsset: string;
  quantity: string;
  price: string;
  deadline: string | null;
};

function text(details: Record<string, unknown>, key: string): string | null {
  const value = details[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * The recorded request names what the order spends (`origin_asset`) and receives
 * (`destination_asset`), so the base asset is the spent one for a sell and the received one for a
 * buy.
 */
function limitOrderTerms(details: Record<string, unknown>): LimitOrderTerms | null {
  const request = details.request;
  if (typeof request !== "object" || request === null) return null;
  const terms = request as Record<string, unknown>;
  const side = terms.side;
  const origin = text(terms, "origin_asset");
  const destination = text(terms, "destination_asset");
  const quantity = text(terms, "quantity");
  const price = text(terms, "price");
  if ((side !== "sell" && side !== "buy") || !origin || !destination || !quantity || !price)
    return null;
  return {
    side,
    baseAsset: side === "sell" ? origin : destination,
    quoteAsset: side === "sell" ? destination : origin,
    quantity,
    price,
    deadline: text(terms, "deadline"),
  };
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
    minAmount: text(details, "min_amount"),
    orderId: text(details, "order_id"),
    limitOrder: limitOrderTerms(details),
  };
}

/** Atomic units shown in the token's own units when the screen knows them, raw otherwise. */
export function evidenceAmount(raw: string, token?: { symbol: string; decimals: number } | null) {
  if (!/^[0-9]{1,78}$/.test(raw)) return raw;
  return token ? `${formatDisplay(raw, token.decimals)} ${token.symbol}` : `${raw} base units`;
}
