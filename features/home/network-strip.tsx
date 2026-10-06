"use client";

import { ListViewIcon, PlayIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { knownChains } from "@/features/assets";
import { cn } from "@/lib/utils";
import { NetworkList } from "./network-list";
import { useNetworkStrip } from "./use-network-strip";

export function NetworkStrip({ compact = false }: { compact?: boolean }) {
  const { listVisible, toggleList, contentId } = useNetworkStrip();
  const chains = knownChains();

  return (
    <div className={cn("flex w-full min-w-0 flex-col", compact ? "gap-[30px]" : "gap-5")}>
      <div id={contentId}>
        {listVisible ? (
          <NetworkList chains={chains} layout="grid" />
        ) : (
          <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)] motion-reduce:overflow-x-auto motion-reduce:[mask-image:none]">
            <div className="marquee-track [animation-duration:90s]">
              <NetworkList chains={chains} layout="strip" />
              <NetworkList chains={chains} layout="strip" duplicate />
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <p className="text-center text-[13px] leading-5 text-muted-foreground">
          {chains.length} {compact ? "supported networks through" : "networks reachable through"}{" "}
          NEAR Intents
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-2 rounded-[6px] text-[13px] font-normal text-muted-foreground hover:text-foreground"
          aria-expanded={listVisible}
          aria-controls={contentId}
          onClick={toggleList}
        >
          <HugeiconsIcon icon={listVisible ? PlayIcon : ListViewIcon} className="size-4" />
          {listVisible ? "Show animation" : "View all networks"}
        </Button>
      </div>
    </div>
  );
}
