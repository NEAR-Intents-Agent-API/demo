import type { BalanceLane } from "./flow-parts";

export function BalanceContext({ label, lane }: { label: string; lane: BalanceLane }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">
        {lane === "private" ? "Private balance" : "Public balance"}
      </span>
    </div>
  );
}
