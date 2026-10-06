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
