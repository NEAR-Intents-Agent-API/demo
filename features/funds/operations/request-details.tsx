"use client";

import type { StatusResponse } from "@near-intents-agent-api/sdk";
import { DetailsDialog } from "@/components/shared/details-dialog";
import { MonoId } from "@/components/shared/identifiers";
import { StatusPill } from "@/components/shared/status";
import { useCatalog } from "@/features/assets";
import { accountTimestamp } from "@/lib/format/date";
import { errorMessage } from "@/lib/http/messages";
import {
  humanize,
  operationActionLabel,
  operationAmountLabel,
  operationMadeBy,
  statusTone,
} from "./operation-display-utils";
import { operationEvidence } from "./operation-evidence";
import { evidenceRows } from "./operation-evidence-rows";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-words">{children}</dd>
    </div>
  );
}

export function RequestDetails({ operation }: { operation: StatusResponse }) {
  const { find } = useCatalog();
  const evidence = operationEvidence(operation);
  const amount = operationAmountLabel(operation, find);
  const asset = evidence.token ? find(evidence.token) : undefined;
  return (
    <DetailsDialog title={operationActionLabel(operation)} description="Wallet operation details.">
      <dl className="space-y-4 text-sm">
        <Field label="Status">
          <StatusPill tone={statusTone(operation.status)} className="capitalize">
            {humanize(operation.status)}
          </StatusPill>
        </Field>
        {operation.failure_code ? (
          <Field label="Reason">{errorMessage(operation.failure_code)}</Field>
        ) : null}
        {evidence.failureReason ? (
          <Field label="Provider note">{evidence.failureReason}</Field>
        ) : null}
        {amount ? <Field label="Amount">{amount}</Field> : null}
        <Field label="Made by">{operationMadeBy(operation)}</Field>
        {evidence.executeAfter && operation.status === "QUEUED" ? (
          <Field label="Runs at">{accountTimestamp(evidence.executeAfter)}</Field>
        ) : null}
        <Field label="When">{accountTimestamp(operation.created_at)}</Field>
        <Field label="Request">
          <MonoId value={operation.correlation_id} head={10} tail={6} />
        </Field>
        {evidenceRows(evidence, asset).map((row) => (
          <Field key={row.label} label={row.label}>
            {row.value}
          </Field>
        ))}
      </dl>
    </DetailsDialog>
  );
}
