"use client";
import type { PolicyView } from "@near-intents-agent-api/sdk";
import { Button } from "@/components/ui/button";
import { formatDelayMs } from "@/lib/format/delay";
import { errorMessage } from "@/lib/http/messages";
import { PolicyManagementSection } from "./policy-management-section";
import { ScheduledList } from "./scheduled-list";
import { useTimelock } from "./use-timelock";

export function TimelockPanel({
  agentId,
  usage,
}: {
  agentId: string;
  usage: PolicyView["usage"]["timelock"];
}) {
  const { scheduled, cancel } = useTimelock(agentId);
  const busy = cancel.isPending;
  const error = cancel.error;
  const items = scheduled.data?.pages.flatMap((page) => page.data) ?? [];
  return (
    <PolicyManagementSection
      title="Scheduled executions"
      description={
        usage.delay_ms === 0
          ? "No execution delay: swaps, transfers and withdrawals run right away unless the schedule holds them. Waiting executions can be cancelled."
          : `Swaps, transfers and withdrawals wait ${formatDelayMs(usage.delay_ms)} before they run. Cancel them while they are waiting.`
      }
    >
      <div className="space-y-3">
        {usage.scheduled_count > 0 ? (
          <p className="text-sm">{usage.scheduled_count} scheduled</p>
        ) : null}
        <ScheduledList
          items={items}
          pending={scheduled.isPending}
          busy={busy}
          onCancel={(id) => cancel.mutate(id)}
        />
        {scheduled.hasNextPage ? (
          <Button
            variant="outline"
            size="sm"
            disabled={scheduled.isFetchingNextPage}
            onClick={() => void scheduled.fetchNextPage()}
          >
            Show more
            {usage.scheduled_count > items.length
              ? ` (${usage.scheduled_count - items.length} not shown)`
              : ""}
          </Button>
        ) : null}
        {cancel.isSuccess && !busy ? (
          <p role="status" className="text-sm text-muted-foreground">
            Execution cancelled. Nothing was sent and it does not count toward your budget.
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {errorMessage(error)}
          </p>
        ) : null}
      </div>
    </PolicyManagementSection>
  );
}
