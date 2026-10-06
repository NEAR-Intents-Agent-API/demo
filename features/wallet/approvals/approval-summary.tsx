import { Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { StatusPill } from "@/components/shared/status";

export function ApprovalSummary({
  count,
  loading,
  failed,
}: {
  count: number;
  loading: boolean;
  failed: boolean;
}) {
  if (count > 0)
    return (
      <StatusPill tone="attention">{count === 1 ? "1 request" : `${count} requests`}</StatusPill>
    );
  if (loading || failed) return null;
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      <HugeiconsIcon
        icon={Tick02Icon}
        className="size-4 shrink-0 text-success"
        aria-hidden="true"
      />
      No pending approvals
    </p>
  );
}
