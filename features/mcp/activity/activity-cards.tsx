import { StatusPill } from "@/components/shared/status";
import { accountTimestamp } from "@/lib/format/date";
import type { McpActivityView } from "../api";
import { ActivityEntryDetails } from "./activity-entry-details";
import { activityOutcome } from "./activity-outcome";

export function McpActivityCards({
  activity,
  operationStatuses,
}: {
  activity: McpActivityView[];
  operationStatuses: ReadonlyMap<string, string>;
}) {
  return (
    <ul className="divide-y md:hidden">
      {activity.map((entry) => {
        const outcome = activityOutcome(entry, operationStatuses);
        return (
          <li key={entry.id} className="space-y-3 px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 space-y-1">
                <p className="break-words text-sm font-medium">{entry.clientName}</p>
                <p className="console-id break-all text-muted-foreground">{entry.tool}</p>
              </div>
              <StatusPill tone={outcome.tone} className="capitalize">
                {outcome.label}
              </StatusPill>
            </div>
            <p className="text-xs text-muted-foreground">{accountTimestamp(entry.createdAt)}</p>
            <ActivityEntryDetails entry={entry} outcome={outcome} />
          </li>
        );
      })}
    </ul>
  );
}
