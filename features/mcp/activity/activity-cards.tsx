import { StatusPill } from "@/components/shared/status";
import { accountTimestamp } from "@/lib/format/date";
import type { McpActivityView } from "../api";
import { ActivityEntryDetails } from "./activity-entry-details";

export function McpActivityCards({ activity }: { activity: McpActivityView[] }) {
  return (
    <ul className="divide-y md:hidden">
      {activity.map((entry) => (
        <li key={entry.id} className="space-y-3 px-4 py-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <p className="break-words text-sm font-medium">{entry.clientName}</p>
              <p className="console-id break-all text-muted-foreground">{entry.tool}</p>
            </div>
            <StatusPill tone={entry.status === "error" ? "blocked" : "ok"} className="capitalize">
              {entry.status}
            </StatusPill>
          </div>
          <p className="text-xs text-muted-foreground">{accountTimestamp(entry.createdAt)}</p>
          <ActivityEntryDetails entry={entry} />
        </li>
      ))}
    </ul>
  );
}
