import type { StatusResponse } from "@near-intents-agent-api/sdk";
import { DetailsDialog } from "@/components/shared/details-dialog";
import { MonoId } from "@/components/shared/identifiers";
import { StatusPill } from "@/components/shared/status";
import { accountTimestamp } from "@/lib/format/date";
import {
  humanize,
  operationActionLabel,
  operationTransactionHash,
  statusTone,
} from "./operation-display-utils";

export function RequestDetails({ operation }: { operation: StatusResponse }) {
  const transaction = operationTransactionHash(operation);
  return (
    <DetailsDialog title={operationActionLabel(operation)} description="Wallet operation details.">
      <dl className="space-y-4 text-sm">
        <div className="space-y-1">
          <dt className="text-muted-foreground">Status</dt>
          <dd>
            <StatusPill tone={statusTone(operation.status)} className="capitalize">
              {humanize(operation.status)}
            </StatusPill>
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-muted-foreground">When</dt>
          <dd>{accountTimestamp(operation.created_at)}</dd>
        </div>
        <div className="space-y-1">
          <dt className="text-muted-foreground">Request</dt>
          <dd>
            <MonoId value={operation.correlation_id} head={10} tail={6} />
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-muted-foreground">Transaction</dt>
          <dd>{transaction ? <MonoId value={transaction} head={10} tail={6} /> : "—"}</dd>
        </div>
      </dl>
    </DetailsDialog>
  );
}
