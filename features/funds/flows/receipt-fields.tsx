"use client";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { useReceiptLabels } from "../model/use-receipt-labels";

/** Optional Reference and Note for a payment; `reference` only where the API takes one. */
export function ReceiptFields({
  labels,
  id,
  withReference = false,
  disabled,
}: {
  labels: ReturnType<typeof useReceiptLabels>;
  id: string;
  withReference?: boolean;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {withReference ? (
        <Field data-invalid={Boolean(labels.referenceProblem)}>
          <FieldLabel htmlFor={`${id}-reference`}>Reference (optional)</FieldLabel>
          <Input
            id={`${id}-reference`}
            value={labels.reference}
            onChange={(event) => labels.setReference(event.target.value)}
            disabled={disabled}
            spellCheck={false}
            autoCapitalize="none"
            autoComplete="off"
            maxLength={128}
            aria-invalid={Boolean(labels.referenceProblem)}
            placeholder="order-42"
          />
          <FieldDescription>
            Your label for this payment. The recipient sees it on the receipt; it is not sent on
            chain.
          </FieldDescription>
          <FieldError>{labels.referenceProblem}</FieldError>
        </Field>
      ) : null}
      <Field data-invalid={Boolean(labels.noteProblem)}>
        <FieldLabel htmlFor={`${id}-note`}>Note (optional)</FieldLabel>
        <Input
          id={`${id}-note`}
          value={labels.note}
          onChange={(event) => labels.setNote(event.target.value)}
          disabled={disabled}
          autoComplete="off"
          maxLength={500}
          aria-invalid={Boolean(labels.noteProblem)}
          placeholder="Why this runs"
        />
        <FieldDescription>
          Kept in this account's record, beside the receipt. Never sent to the provider or included
          in a receipt.
        </FieldDescription>
        <FieldError>{labels.noteProblem}</FieldError>
      </Field>
    </div>
  );
}
