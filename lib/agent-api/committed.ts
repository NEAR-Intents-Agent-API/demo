import type { StatusResponse } from "@near-intents-agent-api/sdk";

/** Operations the revoked client had already committed. Revoking stops new ones, not these. */
export type CommittedOperations = { ids: string[]; truncated: boolean };

export function committedAfterRevoke(
  operation: StatusResponse | null | undefined,
): CommittedOperations | null {
  if (operation?.type !== "grant_revoke") return null;
  const ids = operation.details.committed_correlation_ids ?? [];
  return ids.length ? { ids, truncated: operation.details.committed_truncated === true } : null;
}
