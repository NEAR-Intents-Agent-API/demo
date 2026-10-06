"use client";

import { useState } from "react";
import { Choice } from "@/components/shared/choice";
import { type CatalogOption, TokenChip, TokenPickerDialog } from "@/features/assets";
import type { Rules } from "./rules";
import { RulesAddButton } from "./rules-add-button";
import { RulesSection } from "./rules-section";

type Catalog = { tokens: readonly CatalogOption[]; lookup: (assetId: string) => CatalogOption };

/** Which tokens the account may touch at all: any, or an explicit list shown with logos. */
export function TokenRules({
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
  const [picking, setPicking] = useState(false);
  const listed = rules.tokens === "any" ? [] : rules.tokens;
  const setList = (tokens: Rules["tokens"]) => onChange({ ...rules, tokens });
  return (
    <RulesSection
      embedded={embedded}
      title="Allowed tokens"
      description="Swaps, transfers and withdrawals can only use allowed tokens."
    >
      <Choice
        label="Tokens"
        className="w-full"
        value={rules.tokens === "any" ? "any" : "listed"}
        onChange={(mode) => setList(mode === "any" ? "any" : listed)}
        options={[
          { value: "any", label: "Any token" },
          { value: "listed", label: "Selected tokens" },
        ]}
      />
      {rules.tokens === "any" ? (
        <p className="text-xs leading-5 text-muted-foreground">
          All {catalog.tokens.length || "NEAR Intents"} tokens across{" "}
          {new Set(catalog.tokens.map((token) => token.chain)).size || "every"} networks.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {listed.length} {listed.length === 1 ? "token" : "tokens"}
            </p>
            <RulesAddButton label="Add token" onClick={() => setPicking(true)} />
          </div>
          {listed.length > 0 ? (
            <ul className="divide-y border-y">
              {listed.map((assetId) => (
                <li key={assetId}>
                  <TokenChip
                    token={catalog.lookup(assetId)}
                    onRemove={() => setList(listed.filter((id) => id !== assetId))}
                    className="w-full rounded-none border-0 bg-transparent px-0 py-2.5 [&>span:nth-child(2)]:flex-1 [&>button]:size-8"
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">No tokens selected</p>
          )}
        </div>
      )}
      <TokenPickerDialog
        open={picking}
        onOpenChange={setPicking}
        title="Allow a token"
        description="The same symbol on two networks is two tokens; pick the one the account will hold."
        tokens={catalog.tokens.filter((token) => !listed.includes(token.assetId))}
        onPick={(token) => {
          setList([...listed, token.assetId]);
          setPicking(false);
        }}
      />
    </RulesSection>
  );
}
