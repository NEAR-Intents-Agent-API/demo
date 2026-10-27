import type { PolicyView } from "@near-intents-agent-api/sdk";
import { Disclosure } from "@/components/shared/disclosure";
import { cents } from "../budget-utils";
import { BUDGET_SETTINGS, type BudgetSettingId } from "./budget-setting-utils";

export function BudgetEditUsage({
  field,
  usage,
}: {
  field: BudgetSettingId;
  usage: PolicyView["usage"]["budget"];
}) {
  const window = usage[BUDGET_SETTINGS[field].window];
  return (
    <div className="space-y-3 text-xs leading-5 text-muted-foreground">
      <dl className="flex flex-wrap justify-between gap-x-4 gap-y-1 tabular-nums">
        <div className="flex gap-2">
          <dt>Counted</dt>
          <dd className="text-foreground">
            {window.spent_usd === null ? "Not counted" : `$${cents(window.spent_usd)}`}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt>Current allowance</dt>
          <dd className="text-foreground">
            {window.limit_usd === null
              ? "No cap"
              : `$${cents(window.remaining_usd ?? "0", "down")} left`}
          </dd>
        </div>
      </dl>
      <p>
        Leave empty for no cap. A new amount keeps the current period and its usage; removing the
        cap and adding it again starts a new period.
      </p>
      <Disclosure summary="How usage is counted">
        <div className="space-y-2 pt-2">
          <p>
            Swaps, transfers and withdrawals count at their USD value when they dispatch, and stay
            counted unless the provider provably refused them. Deposits and moves between public and
            private balances do not count. With a cap on, assets without a current price are
            refused.
          </p>
          <p>
            The cap resets in full every {BUDGET_SETTINGS[field].label}, counted from when it was
            turned on. Nothing is counted without a cap. Token caps also apply.
          </p>
          {window.limit_usd !== null ? <p>Installed cap: ${window.limit_usd}.</p> : null}
          {window.resets_at ? <p>Resets: {new Date(window.resets_at).toLocaleString()}.</p> : null}
        </div>
      </Disclosure>
    </div>
  );
}
