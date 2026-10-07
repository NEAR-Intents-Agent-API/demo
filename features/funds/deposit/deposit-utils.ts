import type { CatalogOption } from "@/features/assets";

/** An empty amount is an open deposit; anything typed must parse to a positive amount. */
export function depositReason(
  token: CatalogOption | null,
  amount: string,
  atomic: bigint | null,
): string | null {
  if (!token) return "No token allowed on this network";
  if (amount.trim() && (!atomic || atomic === 0n)) return "Enter a valid amount";
  return null;
}

export function depositArgs(input: {
  token: CatalogOption;
  atomic: bigint | null;
  confidential: boolean;
  key: string;
}) {
  return {
    // The agent is credited the token that was sent, in the chosen balance; refunds go back there.
    source_asset: input.token.assetId,
    ...(input.atomic ? { amount: input.atomic.toString() } : {}),
    confidential: input.confidential,
    idempotencyKey: input.key,
  };
}
