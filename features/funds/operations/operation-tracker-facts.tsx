import { MonoId } from "@/components/shared/identifiers";
import { Row } from "./operation-fact-row";

export function OperationTrackerFacts({
  status,
  operationId,
  details,
  failureCode,
}: {
  status: string;
  operationId: string;
  details: Record<string, unknown>;
  failureCode?: string | null;
}) {
  return (
    <dl className="flex flex-col gap-1 text-sm">
      <Row label="Status" value={status.replaceAll("_", " ").toLowerCase()} />
      <Row label="Request" value={<MonoId value={operationId} head={8} tail={6} />} />
      {typeof details.txHash === "string" ? (
        <Row label="Transaction" value={<MonoId value={details.txHash} head={8} tail={6} />} />
      ) : null}
      {typeof details.destinationTxHash === "string" ? (
        <Row
          label="Destination tx"
          value={<MonoId value={details.destinationTxHash} head={8} tail={6} />}
        />
      ) : null}
      {failureCode ? (
        <Row label="Reason" value={<span className="console-id">{failureCode}</span>} />
      ) : null}
    </dl>
  );
}
