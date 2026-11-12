import type { ReceiptItem, ReceiptTerms } from "@near-intents-agent-api/sdk";

/**
 * The outcome of checking one receipt against the transparency log. `retry` says nothing about
 * the receipt (the log is behind or unreachable); `rejected` means it proves no settled execution.
 */
export type ReceiptVerification =
  | {
      status: "verified";
      settled_at: string;
      leaf_index: string;
      terms: ReceiptTerms;
      /** Fields the API's listing shows that differ from what the log committed to. */
      mismatches: string[];
    }
  | { status: "retry"; reason: string }
  | { status: "rejected"; reason: string };

/**
 * Names the fields where the API's own view of an execution disagrees with the verified terms.
 * The terms are what the log committed to, so a difference is the API's view being wrong.
 */
export function termsMismatches(item: ReceiptItem, terms: ReceiptTerms): string[] {
  const shown: Record<string, unknown> = { type: item.type, ...item.details };
  return Object.entries(terms)
    .filter(([key, value]) => String(shown[key]) !== String(value))
    .map(([key]) => key);
}
