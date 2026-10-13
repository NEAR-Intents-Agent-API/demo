"use client";

import Link from "next/link";
import { MonoId } from "@/components/shared/identifiers";

export const REVOKE_NOTICE_TITLE = "Access revoked; some operations were already committed";

/**
 * Revoking stops new operations at once, but anything the client had already committed still
 * completes. This names those operations and links to where they finish.
 */
export function RevokeNotice({
  ids,
  truncated,
  activityHref,
}: {
  ids: readonly string[];
  truncated: boolean;
  activityHref: string;
}) {
  return (
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
  );
}
