"use client";
import type { Rules } from "./rules";
import { AllowedActions } from "./summary/allowed-actions";
import { RulesConstraints } from "./summary/rules-constraints";
import type { SummaryCatalog } from "./summary/summary-types";

/** Separate action permissions from the limits every action shares. */
export function RulesSummary({ rules, catalog }: { rules: Rules; catalog: SummaryCatalog }) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.6fr)]">
      <AllowedActions rules={rules} />
      <RulesConstraints rules={rules} catalog={catalog} />
    </div>
  );
}
