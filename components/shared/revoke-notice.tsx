"use client";

import Link from "next/link";
import { MonoId } from "@/components/shared/identifiers";
import type { CommittedOperations } from "@/lib/agent-api/committed";

export const REVOKE_NOTICE_TITLE = "Access revoked; some requests were already committed";

/**
 * Revoking stops new operations at once, but anything the client had already committed still
 * completes, and a committed limit-order cancel may still reach the provider. This names both and
 * links to where the operations finish.
 */
export function RevokeNotice({
  committed,
  activityHref,
}: {
  committed: CommittedOperations;
  activityHref: string;
}) {
  const { ids, cancellations, truncated } = committed;
  return (
    <>
      {ids.length ? (
        <>
          <p>
            {ids.length === 1 ? "1 operation" : `${ids.length} operations`}
            {truncated ? " or more" : ""} started before the revoke and will still finish. Watch the
            outcome in{" "}
            <Link href={activityHref} className="underline underline-offset-2">
              Activity
            </Link>
            .
          </p>
          <ul className="mt-2 space-y-1">
            {ids.map((id) => (
              <li key={id}>
                <MonoId value={id} head={14} tail={8} />
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {cancellations.length ? (
        <>
          <p className={ids.length ? "mt-3" : undefined}>
            {cancellations.length === 1
              ? "1 limit-order cancel"
              : `${cancellations.length} limit-order cancels`}
            {truncated ? " or more" : ""} committed before the revoke may still reach the provider.
          </p>
          <ul className="mt-2 space-y-1">
            {cancellations.map((cancel) => (
              <li key={`${cancel.orderId ?? "all"}:${cancel.committedAt}`}>
                {cancel.orderId ? (
                  <MonoId value={cancel.orderId} head={14} tail={8} />
                ) : (
                  "Every open order"
                )}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </>
  );
}
