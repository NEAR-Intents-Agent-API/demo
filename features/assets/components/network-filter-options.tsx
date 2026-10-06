"use client";

import { Button } from "@/components/ui/button";
import { chainInfo } from "../chains";
import { ChainIcon } from "./token-icon";

export function NetworkFilterOptions({
  chains,
  value,
  onPick,
}: {
  chains: readonly string[];
  value: string | null;
  onPick: (chain: string | null) => void;
}) {
  return (
    <div className="flex max-h-[50dvh] flex-col overflow-y-auto">
      <Button
        variant="ghost"
        aria-pressed={value === null}
        onClick={() => onPick(null)}
        className="h-14 shrink-0 justify-start px-2 aria-pressed:text-primary"
      >
        All networks
      </Button>
      {chains.map((id) => (
        <Button
          key={id}
          variant="ghost"
          aria-pressed={value === id}
          onClick={() => onPick(id)}
          className="h-14 shrink-0 justify-start gap-3 px-2 aria-pressed:text-primary"
        >
          <ChainIcon chain={id} size="lg" />
          <span className="truncate text-sm">{chainInfo(id).name}</span>
        </Button>
      ))}
    </div>
  );
}
