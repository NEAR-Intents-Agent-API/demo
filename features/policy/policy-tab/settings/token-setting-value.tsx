import { Disclosure } from "@/components/shared/disclosure";
import type { Rules } from "../../rules/rules";
import type { SummaryCatalog } from "../../rules/summary/summary-types";
import { TokensLine } from "../../rules/summary/tokens-line";

export function TokenSettingValue({ rules, catalog }: { rules: Rules; catalog: SummaryCatalog }) {
  if (rules.tokens === "any") return <span>Any token</span>;
  return (
    <Disclosure
      summary={`${rules.tokens.length} allowed token${rules.tokens.length === 1 ? "" : "s"}`}
    >
      <div className="mt-3 flex flex-wrap gap-2">
        <TokensLine rules={rules} catalog={catalog} />
      </div>
    </Disclosure>
  );
}
