"use client";
import { cn } from "@/lib/utils";
import { ChainIcon } from "./token-icon";

export function ChainChip({
  active,
  onClick,
  label,
  chain,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  chain?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {chain ? <ChainIcon chain={chain} size="xs" /> : null}
      {label}
    </button>
  );
}
