"use client";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { AccessGrantView as Access } from "@/features/funds";

export { useAccessFlow } from "./use-access-flow";

/** Status line for the top of the move panel. */
export function AccessStatus({
  access,
  onManage,
  onRevoke,
  onDestinations,
  revoking,
}: {
  access: Access | null | undefined;
  onManage: () => void;
  onRevoke: () => void;
  onDestinations: () => void;
  revoking: boolean;
}) {
  if (!access) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5 font-medium text-success">
        <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3.5" />
        Dashboard authorized
      </span>
      <span>
        until{" "}
        {new Date(access.expiresAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })}
      </span>
      <button
        type="button"
        onClick={() => onManage()}
        className="underline-offset-2 hover:text-foreground hover:underline"
      >
        Access and rules
      </button>
      <button
        type="button"
        onClick={onDestinations}
        className="underline-offset-2 hover:text-foreground hover:underline"
      >
        Destinations
      </button>
      <button
        type="button"
        onClick={onRevoke}
        disabled={revoking}
        className="underline-offset-2 hover:text-destructive hover:underline"
      >
        {revoking ? "Preparing…" : "Revoke grant"}
      </button>
    </div>
  );
}
