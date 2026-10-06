import { Disclosure } from "@/components/shared/disclosure";
import type { Rules } from "../../rules/rules";
import { LimitsLine } from "../../rules/summary/limits-line";
import type { SummaryCatalog } from "../../rules/summary/summary-types";

export function LimitsSettingValue({ rules, catalog }: { rules: Rules; catalog: SummaryCatalog }) {
  if (rules.limits.length === 0) return <LimitsLine rules={rules} catalog={catalog} />;
  const rate = rules.maxPerHour ? ` · ${rules.maxPerHour} moves / hour` : "";
  return (
    <Disclosure
      summary={`${rules.limits.length} token cap${rules.limits.length === 1 ? "" : "s"}${rate}`}
    >
      <div className="mt-3 flex flex-wrap gap-2">
        <LimitsLine rules={rules} catalog={catalog} />
      </div>
    </Disclosure>
  );
}
