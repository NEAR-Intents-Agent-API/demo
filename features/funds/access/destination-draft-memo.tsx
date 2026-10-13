"use client";

import { OptionSelect } from "@/components/shared/option-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MEMO_MAX_LENGTH } from "./destination-utils";
import type { useDestinationDraft } from "./use-destination-draft";

/** Choosing exact memo keeps withdrawal approval bound to recipient's tag. */
export function DestinationDraftMemo({
  draft,
  disabled,
}: {
  draft: ReturnType<typeof useDestinationDraft>;
  disabled: boolean;
}) {
  return (
    <>
      <OptionSelect
        label="Memo / tag"
        className={draft.hasMemo ? undefined : "sm:col-span-2"}
        value={draft.hasMemo ? "exact" : "none"}
        onChange={(value) => draft.setHasMemo(value === "exact")}
        disabled={disabled}
        options={[
          { value: "none", label: "No memo" },
          { value: "exact", label: "Exact memo" },
        ]}
      />
      {draft.hasMemo ? (
        <Label className="grid gap-2">
          Memo value
          <Input
            value={draft.memo}
            maxLength={MEMO_MAX_LENGTH}
            onChange={(event) => draft.setMemo(event.target.value)}
          />
          <span className="text-xs font-normal text-muted-foreground">
            Up to {MEMO_MAX_LENGTH} characters; it must match exactly.
          </span>
        </Label>
      ) : null}
    </>
  );
}
