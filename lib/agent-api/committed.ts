import type { StatusResponse } from "@near-intents-agent-api/sdk";

/** A limit-order cancel the revoked client had already committed; `orderId` null cancels every open order. */
export type CommittedCancellation = { orderId: string | null; committedAt: string };

/**
 * What the revoked client had already committed. Revoking stops new operations, not these: the
 * operations still finish, and the cancels may still reach the provider.
 */
export type CommittedOperations = {
  ids: string[];
  cancellations: CommittedCancellation[];
  truncated: boolean;
};

export function committedAfterRevoke(
  operation: StatusResponse | null | undefined,
): CommittedOperations | null {
  if (operation?.type !== "grant_revoke") return null;
  const ids = operation.details.committed_correlation_ids ?? [];
  const cancellations = (operation.details.committed_cancellations ?? []).map((cancel) => ({
    orderId: cancel.order_id,
    committedAt: cancel.committed_at,
  }));
  if (!ids.length && !cancellations.length) return null;
  return { ids, cancellations, truncated: operation.details.committed_truncated === true };
}
