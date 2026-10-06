"use client";

import { Button } from "@/components/ui/button";
import { type CatalogOption, TokenPickerDialog } from "@/features/assets";
import { LimitRow } from "./limit-row";
import { RateLimit } from "./rate-limit";
import type { Rules } from "./rules";
import { RulesSection } from "./rules-section";
import { useLimitRules } from "./use-limit-rules";

type Catalog = { tokens: readonly CatalogOption[]; lookup: (assetId: string) => CatalogOption };

/**
 * The most one move may spend, per token, typed in whole tokens with a dollar hint. "One move"
 * is one swap, transfer or withdrawal; totals over time belong to the USD budget.
 */
export function LimitRules({
  rules,
  onChange,
  catalog,
  embedded = false,
}: {
  rules: Rules;
  onChange: (rules: Rules) => void;
  catalog: Catalog;
  embedded?: boolean;
}) {
  const { picking, setPicking, choices, setLimits } = useLimitRules(rules, onChange, catalog);
  return (
    <RulesSection
      embedded={embedded}
      title="Per-move limits"
      description="Limit each token's amount per move and the number of moves per hour."
    >
      <RateLimit rules={rules} onChange={onChange} />
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium">Token caps per move</p>
          <Button type="button" size="sm" variant="outline" onClick={() => setPicking(true)}>
            Add token cap
          </Button>
        </div>
        {rules.limits.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {rules.limits.map((limit) => (
              <LimitRow
                // Decimals arrive with the catalogue; remount so the typed amount uses them.
                key={`${limit.assetId}:${catalog.lookup(limit.assetId).decimals}`}
                token={catalog.lookup(limit.assetId)}
                raw={limit.perTransaction}
                onRaw={(perTransaction) =>
                  setLimits(
                    rules.limits.map((item) =>
                      item.assetId === limit.assetId ? { ...item, perTransaction } : item,
                    ),
                  )
                }
                onRemove={() =>
                  setLimits(rules.limits.filter((item) => item.assetId !== limit.assetId))
                }
              />
            ))}
          </ul>
        ) : (
          <p className="text-xs leading-5 text-muted-foreground">
            No token caps set. Budgets and balances still apply.
          </p>
        )}
      </div>
      <TokenPickerDialog
        open={picking}
        onOpenChange={setPicking}
        title="Cap a token"
        tokens={choices}
        onPick={(token) => {
          setLimits([...rules.limits, { assetId: token.assetId, perTransaction: "" }]);
          setPicking(false);
        }}
      />
    </RulesSection>
  );
}
