"use client";

import { cn } from "@/lib/utils";
import { type OperationTone, PHASES } from "./operation-status";

export function PhaseBar({
  reached,
  tone,
  settled,
}: {
  reached: number;
  tone: OperationTone;
  settled: boolean;
}) {
  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="Progress">
      {PHASES.map((phase, index) => {
        const done = index < reached;
        const failedHere = tone === "bad" && index === reached - 1;
        return (
          <li
            key={phase}
            aria-current={index === reached - 1 && !settled ? "step" : undefined}
            className="flex flex-col gap-2"
          >
            <span
              className={cn(
                "h-1 rounded-sm transition-colors",
                done ? (failedHere ? "bg-destructive" : "bg-primary") : "bg-border",
                index === reached - 1 && !settled && tone === "run" && "animate-pulse",
              )}
            />
            <span className={cn("text-xs", done ? "font-medium" : "text-muted-foreground")}>
              {phase}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
