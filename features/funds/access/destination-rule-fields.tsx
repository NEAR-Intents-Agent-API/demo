"use client";
import type { DestinationRule } from "@near-intents-agent-api/sdk";
import { Choice } from "@/components/shared/choice";
import { DestinationEditor } from "./destination-editor";
import type { DestinationContext } from "./destination-utils";

export const DESTINATION_RULE_COPY: Record<DestinationRule["mode"], string> = {
  only: "Withdrawals and transfers may only go to the destinations below.",
  except: "Withdrawals and transfers may go anywhere except the destinations below.",
  any: "Withdrawals and transfers may go to any address.",
};

/**
 * The account's one destination rule, shared by the dashboard and every connected client.
 * "Only" and "Except" share the list; "Anywhere" has none.
 */
export function DestinationRuleFields({
  value,
  onChange,
  initial,
  onDraftChange,
}: {
  value: DestinationRule;
  onChange: (value: DestinationRule) => void;
  initial?: DestinationContext;
  onDraftChange?: (pending: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Choice<DestinationRule["mode"]>
        label="Where can funds go?"
        value={value.mode}
        onChange={(mode) => {
          if (mode === "any") onDraftChange?.(false);
          onChange({ mode, list: mode === "any" ? [] : value.list });
        }}
        options={[
          { value: "only", label: "Only these" },
          { value: "except", label: "Except these" },
          { value: "any", label: "Anywhere" },
        ]}
      />
      <p className="text-xs leading-5 text-muted-foreground">{DESTINATION_RULE_COPY[value.mode]}</p>
      {value.mode === "any" ? null : (
        <DestinationEditor
          value={value.list}
          mode={value.mode}
          initial={initial}
          onDraftChange={onDraftChange}
          onChange={(list) => onChange({ ...value, list })}
        />
      )}
    </div>
  );
}
