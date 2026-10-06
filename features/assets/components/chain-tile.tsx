"use client";
import { cn } from "@/lib/utils";
import { chainInfo } from "../chains";
import { ChainIcon } from "./token-icon";

export function ChainTile({
  id,
  active,
  onClick,
}: {
  id: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted",
        active && "border-primary bg-accent text-accent-foreground",
      )}
    >
      <ChainIcon chain={id} size="sm" />
      <span className="w-full truncate text-xs font-medium">{chainInfo(id).name}</span>
    </button>
  );
}
