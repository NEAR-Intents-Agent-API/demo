import { cn } from "@/lib/utils";
import type { Who } from "./how-it-works-content";

export function WhoPill({ who }: { who: Who }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 w-[141px] shrink-0 items-center justify-center rounded-[4px] px-[10px] text-[10px] leading-4 font-medium",
        who === "You sign" && "bg-[#fdeb8f] text-black",
        who === "Agent alone" && "bg-primary text-primary-foreground",
        who === "No one" && "bg-[#fdeb8f] text-black",
      )}
    >
      {who === "No one"
        ? "No approval needed"
        : who === "Agent alone"
          ? "Agent acts within rules"
          : who}
    </span>
  );
}
