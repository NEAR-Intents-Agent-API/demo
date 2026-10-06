import { MinusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { formatUsd, TokenChip, usdValue } from "@/features/assets";
import { formatDisplay } from "@/lib/format/amount";
import type { Rules } from "../rules";
import type { SummaryCatalog } from "./summary-types";

export function LimitsLine({ rules, catalog }: { rules: Rules; catalog: SummaryCatalog }) {
  const perHour = rules.maxPerHour ? `at most ${rules.maxPerHour} moves an hour` : null;
  if (rules.limits.length === 0)
    return (
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <HugeiconsIcon icon={MinusSignIcon} className="size-3.5" />
        No per-move cap{perHour ? `, ${perHour}` : ""}
      </span>
    );
  return (
    <>
      {rules.limits.map((limit) => {
        const token = catalog.lookup(limit.assetId);
        const raw = BigInt(limit.perTransaction || "0");
        const usd = formatUsd(usdValue(raw, token));
        return (
          <TokenChip
            key={limit.assetId}
            token={token}
            trailing={
              <span className="pr-0.5 text-xs tabular-nums">
                ≤ {formatDisplay(raw.toString(), token.decimals || null)}
                {usd ? <span className="text-muted-foreground"> · {usd}</span> : null}
              </span>
            }
          />
        );
      })}
      {perHour ? <span className="text-xs text-muted-foreground">{perHour}</span> : null}
    </>
  );
}
