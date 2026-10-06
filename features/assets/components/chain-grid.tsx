"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { foldedChains } from "../picker-utils";
import { ChainTile } from "./chain-tile";

export function ChainGrid({
  chains,
  value,
  onChange,
  limit,
  columns = "grid-cols-2 sm:grid-cols-3",
}: {
  chains: readonly string[];
  value: string | null;
  onChange: (chain: string) => void;
  limit?: number;
  columns?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const folded = limit !== undefined && !expanded && chains.length > limit;
  const visible = folded ? foldedChains(chains, limit ?? chains.length, value) : chains;
  return (
    <fieldset className={cn("grid gap-2", columns)}>
      <legend className="sr-only">Network</legend>
      {visible.map((id) => (
        <ChainTile key={id} id={id} active={value === id} onClick={() => onChange(id)} />
      ))}
      {folded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex items-center justify-center gap-2 rounded-md border bg-card px-3 py-2.5 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <span className="text-base leading-none">+{chains.length - visible.length}</span>
          More networks
        </button>
      ) : null}
    </fieldset>
  );
}
