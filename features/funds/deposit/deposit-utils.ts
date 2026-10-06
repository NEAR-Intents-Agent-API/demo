import type { CatalogOption } from "@/features/assets";

export function depositReason(
  token: CatalogOption | null,
  atomic: bigint | null,
  missingRefund: boolean,
): string | null {
  if (!token) return "No token allowed on this network";
  if (!atomic || atomic === 0n) return "Enter an amount";
  return missingRefund ? "Enter a refund address" : null;
}

export function depositArgs(input: {
  token: CatalogOption;
  atomic: bigint;
  confidential: boolean;
  refund: string | null;
  key: string;
}) {
  return {
    source_asset: input.token.assetId,
    // Omitted, the provider credits USDC; the same id credits the token that was sent.
    ...(input.confidential ? {} : { destination_asset: input.token.assetId }),
    amount: input.atomic.toString(),
    confidential: input.confidential,
    ...(input.refund ? { refund_address: input.refund } : {}),
    idempotencyKey: input.key,
  };
}
