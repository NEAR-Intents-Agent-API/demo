import { ArrowDown02Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

const LINK_TONES = ["text-warning", "text-foreground/50", "text-success"] as const;

/** A short connector with its label; points right on wide screens, down when stacked. */
export function FlowLink({ label, index }: { label: string; index: number }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 py-0.5 xl:w-20 xl:flex-col xl:gap-1 xl:py-0",
        LINK_TONES[index] ?? "text-foreground/50",
      )}
    >
      <span className="flex items-center xl:hidden">
        <span className="flow-line-y h-4" />
        <HugeiconsIcon icon={ArrowDown02Icon} className="-mt-1.5 size-3.5" />
      </span>
      <span className="hidden w-full items-center xl:flex">
        <span className="flow-line-x flex-1" />
        <HugeiconsIcon icon={ArrowRight01Icon} className="-ml-2 size-3.5 shrink-0" />
      </span>
      <span className="max-w-24 text-center text-[10px] leading-3.5 font-medium text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
