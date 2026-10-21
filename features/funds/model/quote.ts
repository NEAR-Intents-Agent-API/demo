/**
 * Reading provider quotes without trusting their shape.
 *
 * `swap` and `withdraw` dry-runs return the provider's own quote object, snake_cased, and the
 * fields it carries differ by route. The screens only need a few headline numbers; everything
 * else is kept for the "details" disclosure, so an unfamiliar field is shown, never dropped and
 * never assumed.
 */

type Json = Record<string, unknown>;

const isRecord = (value: unknown): value is Json =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Unwraps `{ data: { quote } }` (tool result) or `{ quote }` down to the quote object. */
export function extractQuote(result: unknown): Json | null {
  let node: unknown = result;
  for (let depth = 0; depth < 3 && isRecord(node); depth += 1) {
    if (isRecord(node.quote)) return node.quote;
    node = node.data;
  }
  return isRecord(node) ? node : null;
}

/** Finds the first string/number under any of `keys`, looking one object level down too. */
export function pick(quote: Json | null, keys: readonly string[]): string | null {
  if (!quote) return null;
  const scan = (source: Json): string | null => {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === "string" && value !== "") return value;
      if (typeof value === "number" && Number.isFinite(value)) return String(value);
    }
    return null;
  };
  const direct = scan(quote);
  if (direct) return direct;
  for (const value of Object.values(quote)) {
    if (isRecord(value)) {
      const nested = scan(value);
      if (nested) return nested;
    }
  }
  return null;
}

export const isAtomic = (value: string | null): value is string =>
  value !== null && /^[0-9]{1,78}$/.test(value);

/** Every scalar in the quote, flattened for the details list. */
export function quoteEntries(quote: Json | null): [string, string][] {
  if (!quote) return [];
  const rows: [string, string][] = [];
  const visit = (source: Json, prefix: string) => {
    for (const [key, value] of Object.entries(source)) {
      const label = prefix ? `${prefix}.${key}` : key;
      if (isRecord(value)) visit(value, label);
      else if (typeof value === "string" || typeof value === "number" || typeof value === "boolean")
        rows.push([label, String(value)]);
    }
  };
  visit(quote, "");
  return rows.slice(0, 24);
}

/** `amount_out_usd` → "Amount out usd". */
export function labelFor(key: string): string {
  const last = key.split(".").pop() ?? key;
  const spaced = last.replaceAll("_", " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** The API's own valuation of a quoted fee, in USD and as a percentage of the amount sent. */
export type QuoteFee = { amount_usd: string; percent: string };

/**
 * A withdraw dry-run as the review needs it: the provider's quote plus the API's top-level `fee`.
 * The API values the fee only on chain near; on every bridged withdrawal it is null, because the
 * quote's `amount_out` is in the destination chain's asset.
 */
export type WithdrawPreview = {
  quote: Json | null;
  fee: QuoteFee | null;
};

const decimalPattern = /^-?\d{1,30}(\.\d{1,30})?$/;

/** Reads `{ data: { quote, fee } }` (tool result) or `{ quote, fee }` into a `WithdrawPreview`. */
export function extractWithdrawPreview(result: unknown): WithdrawPreview {
  let node: unknown = result;
  for (let depth = 0; depth < 3 && isRecord(node); depth += 1) {
    if (isRecord(node.quote)) return { quote: node.quote, fee: quoteFee(node.fee) };
    node = node.data;
  }
  return { quote: isRecord(node) ? node : null, fee: null };
}

function quoteFee(value: unknown): QuoteFee | null {
  if (!isRecord(value)) return null;
  const { amount_usd, percent } = value;
  if (typeof amount_usd !== "string" || !decimalPattern.test(amount_usd)) return null;
  if (typeof percent !== "string" || !decimalPattern.test(percent)) return null;
  return { amount_usd, percent };
}

export type WithdrawFacts = {
  /**
   * What lands at the destination, atomic units: of the withdrawn token on chain near, of the
   * destination chain's asset on a bridged withdrawal.
   */
  received: string | null;
  /** The least the provider guarantees to deliver, atomic units like `received`. */
  minimumReceived: string | null;
  /** The smallest amount the route accepts, atomic units of the withdrawn token. */
  minimumAmount: string | null;
  /** The API's valuation of the fee; null where it is not valued (every bridged withdrawal). */
  fee: QuoteFee | null;
};

/** The headline facts of a withdraw preview, by the field names the Agent API documents. */
export function withdrawFacts(preview: WithdrawPreview | null): WithdrawFacts {
  const quote = preview?.quote ?? null;
  return {
    received: pick(quote, ["amount_out", "amount_received", "receive_amount"]),
    minimumReceived: pick(quote, ["min_amount_out"]),
    minimumAmount: pick(quote, ["min_amount"]),
    fee: preview?.fee ?? null,
  };
}
