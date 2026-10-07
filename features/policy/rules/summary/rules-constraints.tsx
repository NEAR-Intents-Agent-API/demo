import {
  Clock01Icon,
  Coins01Icon,
  DashboardSpeed01Icon,
  Location01Icon,
  UserCheck01Icon,
} from "@hugeicons/core-free-icons";
import type { Rules } from "../rules";
import { describeSchedule } from "../schedule";
import { DestinationsLine } from "./destinations-line";
import { LimitsLine } from "./limits-line";
import { SummaryField } from "./summary-field";
import type { SummaryCatalog } from "./summary-types";
import { TokensLine } from "./tokens-line";

export function RulesConstraints({ rules, catalog }: { rules: Rules; catalog: SummaryCatalog }) {
  return (
    <section className="min-w-0">
      <h3 className="mb-3 text-sm font-medium">Limits and approvals</h3>
      <dl className="grid gap-x-5 sm:grid-cols-2">
        <SummaryField icon={Coins01Icon} label="Tokens">
          <TokensLine rules={rules} catalog={catalog} />
        </SummaryField>
        <SummaryField icon={DashboardSpeed01Icon} label="Per move">
          <LimitsLine rules={rules} catalog={catalog} />
        </SummaryField>
        <SummaryField icon={Location01Icon} label="Destinations">
          <DestinationsLine rules={rules} />
        </SummaryField>
        <SummaryField icon={Clock01Icon} label="Schedule">
          {describeSchedule(rules.schedule)}
        </SummaryField>
        <SummaryField icon={UserCheck01Icon} label="Approval">
          {rules.approval ? "Every move waits for your approval" : "Acts on its own"}
        </SummaryField>
      </dl>
    </section>
  );
}
