import type { StatusResponse } from "@near-intents-agent-api/sdk";
import { StatusPill } from "@/components/shared/status";
import { accountTimestamp } from "@/lib/format/date";
import { humanize, operationActionLabel, statusTone } from "./operation-display-utils";
import { RequestDetails } from "./request-details";

export function RequestsCards({ operations }: { operations: StatusResponse[] }) {
  return (
    <ul className="divide-y md:hidden">
      {operations.map((operation) => {
        return (
          <li key={operation.correlation_id} className="space-y-3 px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">{operationActionLabel(operation)}</p>
              <StatusPill tone={statusTone(operation.status)} className="capitalize">
                {humanize(operation.status)}
              </StatusPill>
            </div>
            <p className="text-xs text-muted-foreground">
              {accountTimestamp(operation.created_at)}
            </p>
            <RequestDetails operation={operation} />
          </li>
        );
      })}
    </ul>
  );
}
