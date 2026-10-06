import type { ScheduledExecutionView } from "@near-intents-agent-api/sdk";
import { Loading } from "@/components/shared/states";
import { Button } from "@/components/ui/button";

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
          <div>
            <p className="text-sm font-medium leading-6">{item.action ?? "Execution"}</p>
            <p className="text-xs text-muted-foreground">
              {item.state === "waiting"
                ? `Earliest execution: ${new Date(item.execute_after).toLocaleString()}`
                : "Dispatching"}
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
