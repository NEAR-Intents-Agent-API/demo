"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

export function FlowDivider({ icon }: { icon: Parameters<typeof HugeiconsIcon>[0]["icon"] }) {
  return (
    <div className="flex justify-center py-0.5">
      <span className={cn("flex items-center")}>
        <HugeiconsIcon icon={icon} className="size-4 text-muted-foreground" />
      </span>
    </div>
  );
}
