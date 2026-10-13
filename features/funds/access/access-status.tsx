"use client";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { AccessGrantView as Access } from "@/features/funds";
import { accessWhen, endedDashboardAccess } from "./access-display";
import { useGrants } from "./use-grants";

export { useAccessFlow } from "./use-access-flow";

/** Status line for the top of the move panel. */
export function AccessStatus({
  agentId,
  access,
  onManage,
  onRevoke,
  onDestinations,
  revoking,
}: {
  agentId: string;
  access: Access | null | undefined;
  onManage: () => void;
  onRevoke: () => void;
  onDestinations: () => void;
  revoking: boolean;
}) {
  const { view } = useGrants(agentId);
  if (!access) {
    // Dashboard access that ended stays on record: say when, instead of showing nothing.
    const ended = endedDashboardAccess(view.data?.data ?? []);
    if (!ended) return null;
    return (
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-4 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          Dashboard access {accessWhen(ended.grant)}
        </span>
        {ended.olderActive > 0 ? (
          <span>
            An older dashboard grant is still active; the dashboard only uses its newest grant.
          </span>
        ) : null}
      </div>
    );
  }
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-4 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5 font-medium text-success">
        <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3.5" />
        Dashboard authorized
      </span>
      <span>{accessWhen(access)}</span>
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
