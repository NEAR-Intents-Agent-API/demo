"use client";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chainInfo } from "../chains";
import { ChainIcon } from "./token-icon";

export function NetworkList({
  chains,
  selected,
  query,
  onQuery,
  onPick,
}: {
  chains: readonly string[];
  selected: string | null;
  query: string;
  onQuery: (query: string) => void;
  onPick: (chain: string) => void;
}) {
  return (
    <div className="flex min-h-0 min-w-0 flex-col gap-3">
      <div className="relative">
        <HugeiconsIcon
          icon={Search01Icon}
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          autoFocus
          aria-label="Search networks"
          placeholder="Search networks"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          className="h-10 pl-9"
        />
      </div>
      <ul className="flex max-h-[min(24rem,50dvh)] flex-col overflow-y-auto">
        {chains.map((id) => (
          <li key={id}>
            <Button
              variant="ghost"
              onClick={() => onPick(id)}
              aria-pressed={selected === id}
              className="h-14 w-full cursor-pointer justify-start gap-3 px-2 py-2 text-foreground hover:bg-transparent hover:text-foreground dark:hover:bg-transparent"
            >
              <ChainIcon chain={id} size="lg" />
              <span className="min-w-0 flex-1 truncate text-left text-sm font-medium">
                {chainInfo(id).name}
              </span>
            </Button>
          </li>
        ))}
        {chains.length === 0 ? (
          <li className="px-3 py-8 text-center text-sm text-muted-foreground">
            No network matches “{query}”.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
