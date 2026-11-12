"use client";

import type { ReceiptItem } from "@near-intents-agent-api/sdk";
import { DetailsDialog } from "@/components/shared/details-dialog";
import { MonoId } from "@/components/shared/identifiers";
import { Unavailable } from "@/components/shared/states";
import { StatusPill } from "@/components/shared/status";
import { Button } from "@/components/ui/button";
import { useCatalog } from "@/features/assets";
import { accountTimestamp } from "@/lib/format/date";
import {
  receiptAmountLabel,
  receiptStatusLabel,
  receiptStatusTone,
  receiptTypeLabel,
  receiptUsdLabel,
} from "./receipt-display";
import { useReceiptVerification } from "./use-receipts";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-words">{children}</dd>
    </div>
  );
}

/** The check runs on this server against the pinned log and witness, never on the API's word. */
function VerifyReceipt({ agentId, item }: { agentId: string; item: ReceiptItem }) {
  const check = useReceiptVerification(agentId, item.correlation_id);
  const verdict = check.data;
  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={item.status !== "PROVEN" || check.isFetching}
        onClick={() => void check.refetch()}
      >
        {check.isFetching ? "Checking the log" : "Verify"}
      </Button>
      {item.status === "PENDING" ? (
        <p className="text-muted-foreground">
          This execution is not in the transparency log yet. Verify it once it shows as proven.
        </p>
      ) : null}
      {item.status === "UNLOGGED" ? (
        <p className="text-muted-foreground">
          This execution settled without a receipt, so there is nothing to verify.
        </p>
      ) : null}
      {check.error ? (
        <Unavailable code={check.error.message} onRetry={() => void check.refetch()} />
      ) : null}
      {!check.isFetching && verdict?.status === "verified" ? (
        <div role="status" className="space-y-1">
          <StatusPill tone="ok">Verified</StatusPill>
          <p className="text-muted-foreground">
            The terms below are in the transparency log (entry {verdict.leaf_index}), under a head
            the log's witness signed.
          </p>
          {verdict.mismatches.length > 0 ? (
            <p role="alert" className="text-destructive">
              The API shows different values for: {verdict.mismatches.join(", ")}. Trust the log.
            </p>
          ) : null}
        </div>
      ) : null}
      {!check.isFetching && verdict?.status === "retry" ? (
        <p role="status" className="text-muted-foreground">
          {verdict.reason}
        </p>
      ) : null}
      {!check.isFetching && verdict?.status === "rejected" ? (
        <div role="alert" className="space-y-1">
          <StatusPill tone="blocked">Not verified</StatusPill>
          <p className="text-destructive">{verdict.reason}</p>
        </div>
      ) : null}
    </div>
  );
}

export function ReceiptDetails({ agentId, item }: { agentId: string; item: ReceiptItem }) {
  const { find } = useCatalog();
  const amount = receiptAmountLabel(item, find);
  const usd = receiptUsdLabel(item);
  const { details } = item;
  return (
    <DetailsDialog title={receiptTypeLabel(item)} description="Settled execution and its receipt.">
      <dl className="space-y-4 text-sm">
        <Field label="Receipt">
          <StatusPill tone={receiptStatusTone(item.status)} className="capitalize">
            {receiptStatusLabel(item.status)}
          </StatusPill>
        </Field>
        {amount ? <Field label="Amount">{amount}</Field> : null}
        {usd ? <Field label="Value when settled">{usd}</Field> : null}
        {"recipient" in details ? (
          <Field label="Recipient">
            <MonoId value={details.recipient} head={14} tail={8} />
          </Field>
        ) : null}
        {"chain" in details ? <Field label="Network">{details.chain}</Field> : null}
        {"reference" in details && details.reference ? (
          <Field label="Reference">{details.reference}</Field>
        ) : null}
        {details.note ? <Field label="Note">{details.note}</Field> : null}
        <Field label="Balance">{details.confidential ? "Confidential" : "Public"}</Field>
        <Field label="Settled">{accountTimestamp(details.settled_at)}</Field>
        <Field label="Request">
          <MonoId value={item.correlation_id} head={10} tail={6} />
        </Field>
        <Field label="Check against the log">
          <VerifyReceipt agentId={agentId} item={item} />
        </Field>
      </dl>
    </DetailsDialog>
  );
}
