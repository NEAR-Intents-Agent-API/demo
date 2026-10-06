import { ChainStack, TokenChip } from "@/features/assets";
import type { Rules } from "../rules";
import type { SummaryCatalog } from "./summary-types";

export function TokensLine({ rules, catalog }: { rules: Rules; catalog: SummaryCatalog }) {
  if (rules.tokens === "any") {
    const chains = [...new Set(catalog.tokens.map((token) => token.chain))];
    return (
      <span className="flex flex-wrap items-center gap-2 text-sm">
        Any token
        {chains.length ? <ChainStack chains={chains} max={6} size="xs" /> : null}
      </span>
    );
  }
  return rules.tokens.map((assetId) => <TokenChip key={assetId} token={catalog.lookup(assetId)} />);
}
