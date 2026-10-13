import type { ScheduledExecutionView } from "@near-intents-agent-api/sdk";
import { Loading } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { scheduledActionLabel, scheduledTiming } from "./scheduled-label";

export function ScheduledList({
  items,
  pending,
  busy,
  onCancel,
}: {
  items: ScheduledExecutionView[];
  pending: boolean;
  busy: boolean;
  onCancel: (correlationId: string) => void;
}) {
  return items.length ? (
    <ul className="divide-y">
      {items.map((item) => (
        <li
          key={item.correlation_id}
          className="flex flex-wrap items-center justify-between gap-3 py-3"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium leading-6">{scheduledActionLabel(item.action)}</p>
            <p className="text-xs text-muted-foreground">{scheduledTiming(item)}</p>
            <p className="text-xs text-muted-foreground">
              Reference {item.correlation_id.slice(0, 12)}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={busy || item.state !== "waiting"}
            onClick={() => onCancel(item.correlation_id)}
          >
            Cancel execution
          </Button>
        </li>
      ))}
    </ul>
  ) : pending ? (
    <Loading rows={1} />
  ) : (
    <p className="text-sm">No scheduled executions</p>
  );
}
