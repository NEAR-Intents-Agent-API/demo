import { MonoId } from "@/components/shared/identifiers";
import { errorMessage } from "@/lib/http/messages";
import { operationEvidence } from "./operation-evidence";
import { evidenceRows } from "./operation-evidence-rows";
import { Row } from "./operation-fact-row";

export function OperationTrackerFacts({
  status,
  operationId,
  details,
  failureCode,
  token,
}: {
  status: string;
  operationId: string;
  details: Record<string, unknown>;
  failureCode?: string | null;
  token?: { symbol: string; decimals: number } | null;
}) {
  const evidence = operationEvidence({ details });
  return (
    <dl className="flex flex-col gap-1 text-sm">
      <Row label="Status" value={status.replaceAll("_", " ").toLowerCase()} />
      <Row label="Request" value={<MonoId value={operationId} head={8} tail={6} />} />
      {evidenceRows(evidence, token).map((row) => (
        <Row key={row.label} label={row.label} value={row.value} />
      ))}
      {failureCode ? <Row label="Reason" value={errorMessage(failureCode)} /> : null}
      {evidence.failureReason ? <Row label="Provider note" value={evidence.failureReason} /> : null}
    </dl>
  );
}
