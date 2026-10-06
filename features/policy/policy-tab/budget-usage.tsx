import type { PolicyView } from "@near-intents-agent-api/sdk";
import { cents } from "./budget-utils";

export function BudgetUsage({ window }: { window: PolicyView["usage"]["budget"]["daily"] }) {
  return (
    <div className="space-y-1.5">
      <p className="text-lg font-medium tabular-nums">
        {window.limit_usd === null
          ? "No cap"
          : `$${cents(window.remaining_usd ?? "0", "down")} left`}
      </p>
      <p className="text-xs leading-5 text-muted-foreground">
        ${cents(window.spent_usd)} counted
        {window.limit_usd !== null ? ` · $${window.limit_usd} cap` : ""}
      </p>
      {window.limit_usd !== null && window.resets_at ? (
        <p className="text-xs leading-5 text-muted-foreground">
          Next release {new Date(window.resets_at).toLocaleString()}
        </p>
      ) : null}
    </div>
  );
}
