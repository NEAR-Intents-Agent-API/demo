"use client";
import type { PolicyView } from "@near-intents-agent-api/sdk";
import { Disclosure } from "@/components/shared/disclosure";
import { Panel } from "@/components/shared/page";
import { BudgetUsage } from "./budget-usage";
import { BUDGET_WINDOWS } from "./budget-utils";

export { cents } from "./budget-utils";

export function BudgetPanel({
  usage,
  plain = false,
  window,
}: {
  usage: PolicyView["usage"]["budget"];
  plain?: boolean;
  window?: keyof PolicyView["usage"]["budget"];
}) {
  return (
    <Panel
      plain={plain}
      title="Current budget usage"
      description="Remaining allowance across the dashboard and all clients."
    >
      <div className="space-y-4">
        <div className={window ? "grid gap-3" : "grid gap-3 sm:grid-cols-3"}>
          {BUDGET_WINDOWS.filter(({ key }) => !window || key === window).map(({ key, label }) => (
            <section key={key} className="space-y-2">
              <h3 className="text-sm font-medium">{label} (USD)</h3>
              <BudgetUsage window={usage[key]} />
            </section>
          ))}
        </div>
        <Disclosure summary="How the budget is counted">
          <p className="mt-3 max-w-4xl text-xs leading-6 text-muted-foreground">
            Swaps (even between this account's own tokens), withdrawals and transfers count at their
            USD value when they run; shielding, unshielding and deposits do not. An asset with no
            current price is refused. Windows roll: each charge is released 24 hours, 7 days or 30
            days after it was counted. Changing a cap never resets what is already counted, and
            usage stays tracked even while caps are cleared. Token limits in the same rules also
            apply; a larger budget does not lift them.
          </p>
        </Disclosure>
      </div>
    </Panel>
  );
}
