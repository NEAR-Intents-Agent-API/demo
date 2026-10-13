import { DetailsDialog } from "@/components/shared/details-dialog";
import { MonoId } from "@/components/shared/identifiers";
import { StatusPill } from "@/components/shared/status";
import { accountTimestamp } from "@/lib/format/date";
import type { McpActivityView } from "../api";
import type { ActivityOutcome } from "./activity-outcome";

const CONNECTION = { oauth: "OAuth", api_key: "API key", dashboard: "Dashboard" } as const;

export function ActivityEntryDetails({
  entry,
  outcome,
}: {
  entry: McpActivityView;
  outcome: ActivityOutcome;
}) {
  return (
    <DetailsDialog title="Client request" description="Client request details.">
      <dl className="space-y-4 text-sm">
        <div>
          <dt className="text-muted-foreground">Source</dt>
          <dd>{entry.clientName}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Tool</dt>
          <dd className="break-words">{entry.tool}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Result</dt>
          <dd>
            <StatusPill tone={outcome.tone} className="capitalize">
              {outcome.label}
            </StatusPill>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">When</dt>
          <dd>{accountTimestamp(entry.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Connection</dt>
          <dd>{CONNECTION[entry.authKind]}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Wallet operation</dt>
          <dd>
            {entry.operationId ? <MonoId value={entry.operationId} head={8} tail={4} /> : "None"}
          </dd>
        </div>
        {entry.detail ? (
          <div>
            <dt className="text-muted-foreground">Result details</dt>
            <dd className="max-w-sm whitespace-normal break-words leading-5">{entry.detail}</dd>
          </div>
        ) : null}
      </dl>
    </DetailsDialog>
  );
}
