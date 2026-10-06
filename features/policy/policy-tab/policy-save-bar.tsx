"use client";

import { SecurityLockIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Pending } from "@/components/shared/states";
import { Button } from "@/components/ui/button";

export function PolicySaveBar({
  busy,
  stage,
  blocked,
  onCancel,
  onSave,
  compact = false,
}: {
  busy: boolean;
  stage: string;
  blocked: boolean;
  onCancel: () => void;
  onSave: () => void;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "space-y-2" : "flex flex-col gap-3 border-t pt-4"}>
      {!compact ? (
        <p className="text-xs leading-5 text-muted-foreground">
          One signature saves all edited account rules.
        </p>
      ) : null}
      <div className={compact ? "grid grid-cols-2 gap-2" : "flex w-full justify-end gap-2"}>
        <Button
          variant="outline"
          disabled={busy}
          onClick={onCancel}
          className={compact ? "min-w-0 px-2 text-xs" : undefined}
        >
          Cancel
        </Button>
        <Button
          disabled={busy || blocked}
          onClick={onSave}
          className={compact ? "min-w-0 px-2 text-xs" : undefined}
        >
          {busy ? <Pending /> : <HugeiconsIcon icon={SecurityLockIcon} className="size-4" />}
          <span className={compact ? "min-w-0 truncate" : undefined}>
            {busy ? stage || "Saving…" : "Sign and save"}
          </span>
        </Button>
      </div>
    </div>
  );
}
