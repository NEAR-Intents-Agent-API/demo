"use client";
import type { Destination } from "@near-intents-agent-api/sdk";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { destinationLabel } from "@/lib/agent-api/schemas";
import { DestinationDraftFields } from "./destination-draft-fields";
import { DestinationList } from "./destination-list";
import type { DestinationContext } from "./destination-utils";
import { useDestinationDraft } from "./use-destination-draft";

export function DestinationEditor({
  value,
  onChange,
  disabled = false,
  mode,
  initial,
  onDraftChange,
}: {
  value: Destination[];
  onChange: (value: Destination[]) => void;
  disabled?: boolean;
  mode: "only" | "except";
  initial?: DestinationContext;
  onDraftChange?: (pending: boolean) => void;
}) {
  const draft = useDestinationDraft((next) => {
    if (
      value.length < 128 &&
      !value.some(
        (item) => destinationLabel(item) === destinationLabel(next) && item.action === next.action,
      )
    )
      onChange([...value, next]);
  }, initial);
  useEffect(() => onDraftChange?.(draft.pending), [onDraftChange, draft.pending]);
  return (
    <div className="space-y-4">
      <fieldset disabled={disabled} className="space-y-3">
        <legend className="sr-only">Add a destination</legend>
        <DestinationDraftFields draft={draft} initial={initial} disabled={disabled} />
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={draft.add}
            disabled={
              disabled ||
              !draft.address ||
              value.length >= 128 ||
              (draft.action === "withdraw" && !draft.chain) ||
              (draft.hasMemo && !draft.memo)
            }
          >
            Add destination
          </Button>
        </div>
        {draft.error ? (
          <p role="alert" className="text-sm text-destructive">
            {draft.error}
          </p>
        ) : null}
      </fieldset>
      <div className="border-t pt-4">
        <DestinationList
          destinations={value}
          mode={mode}
          disabled={disabled}
          onRemove={(index) => onChange(value.filter((_, position) => position !== index))}
        />
      </div>
    </div>
  );
}
