import { MonoId } from "@/components/shared/identifiers";
import { evidenceAmount, type OperationEvidence } from "./operation-evidence";

export type EvidenceRow = { label: string; value: React.ReactNode };

/**
 * The transaction and refund facts the Agent API recorded, in reading order. Every hash and
 * account is copyable in full; a row appears only once the API has the fact.
 */
export function evidenceRows(
  evidence: OperationEvidence,
  token?: { symbol: string; decimals: number } | null,
): EvidenceRow[] {
  const hash = (value: string) => <MonoId value={value} head={8} tail={6} />;
  const rows: EvidenceRow[] = [];
  if (evidence.txHash) rows.push({ label: "Transaction", value: hash(evidence.txHash) });
  if (evidence.depositTxHash)
    rows.push({ label: "Deposit transaction", value: hash(evidence.depositTxHash) });
  if (evidence.destinationTxHash)
    rows.push({ label: "Destination transaction", value: hash(evidence.destinationTxHash) });
  if (evidence.refundedAmount)
    rows.push({ label: "Refunded", value: evidenceAmount(evidence.refundedAmount, token) });
  if (evidence.refundTo)
    rows.push({
      label: "Refunded to",
      value: <MonoId value={evidence.refundTo} head={10} tail={6} />,
    });
  if (evidence.refundTxHash)
    rows.push({ label: "Refund transaction", value: hash(evidence.refundTxHash) });
  return rows;
}
