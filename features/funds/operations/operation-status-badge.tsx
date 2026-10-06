"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Pending } from "@/components/shared/states";
import { cn } from "@/lib/utils";
import type { OperationTone } from "./operation-status";

import { TONE_ICON, TONE_STYLE } from "./operation-style-utils";

export function StatusBadge({ tone }: { tone: OperationTone }) {
  return (
    <span className={cn("flex shrink-0 items-center pt-0.5", TONE_STYLE[tone])}>
      {tone === "run" ? (
        <Pending className="size-5" />
      ) : (
        <HugeiconsIcon icon={TONE_ICON[tone]} className="size-5" />
      )}
    </span>
  );
}
