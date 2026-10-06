"use client";

import { OptionSelect } from "@/components/shared/option-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { chainInfo, useCatalog } from "@/features/assets";
import { DestinationDraftMemo } from "./destination-draft-memo";
import {
  DESTINATION_ACTIONS,
  type DestinationAction,
  type DestinationContext,
} from "./destination-utils";
import type { useDestinationDraft } from "./use-destination-draft";

/** Route, recipient and exact memo fields for one typed destination. */
export function DestinationDraftFields({
  draft,
  initial,
  disabled,
}: {
  draft: ReturnType<typeof useDestinationDraft>;
  initial?: DestinationContext;
  disabled: boolean;
}) {
  const catalog = useCatalog();
  const networks = [...new Set([...catalog.chains, ...(draft.chain ? [draft.chain] : [])])];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {initial?.action ? (
        <p className="text-sm font-medium sm:col-span-2">
          {DESTINATION_ACTIONS.find((option) => option.value === initial.action)?.label}
        </p>
      ) : (
        <OptionSelect<DestinationAction>
          label="Action"
          className={draft.action === "withdraw" ? undefined : "sm:col-span-2"}
          value={draft.action}
          onChange={draft.setAction}
          disabled={disabled}
          options={DESTINATION_ACTIONS}
        />
      )}
      {draft.action === "withdraw" ? (
        <OptionSelect
          label="Network"
          value={draft.chain}
          onChange={draft.setChain}
          disabled={disabled || networks.length === 0}
          options={[
            {
              value: "",
              label: catalog.query.isPending ? "Loading networks…" : "Choose a network",
            },
            ...networks.map((value) => ({ value, label: chainInfo(value).name })),
          ]}
        />
      ) : null}
      <Label className="grid gap-2 sm:col-span-2">
        {draft.action === "withdraw" ? "Destination address" : "NEAR Intents account"}
        <Input
          value={draft.address}
          onChange={(event) => draft.setAddress(event.target.value)}
          spellCheck={false}
          autoCapitalize="none"
          autoComplete="off"
          maxLength={256}
        />
      </Label>
      {draft.action === "withdraw" ? (
        <DestinationDraftMemo draft={draft} disabled={disabled} />
      ) : null}
    </div>
  );
}
