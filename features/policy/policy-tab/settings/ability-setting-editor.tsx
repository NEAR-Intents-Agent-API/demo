import { Switch } from "@/components/ui/switch";
import { LimitOrderField } from "../../rules/limit-order-field";
import type { Ability, Rules } from "../../rules/rules";

export function AbilitySettingEditor({
  ability,
  rules,
  onChange,
}: {
  ability: Ability;
  rules: Rules;
  onChange: (rules: Rules) => void;
}) {
  return (
    <div className="space-y-4">
      <Switch
        label="Enabled"
        checked={rules.abilities[ability]}
        className="py-0"
        onChange={(checked) =>
          onChange({ ...rules, abilities: { ...rules.abilities, [ability]: checked } })
        }
      />
      {ability === "limit_order" && rules.abilities.limit_order ? (
        <LimitOrderField rules={rules} onChange={onChange} />
      ) : null}
    </div>
  );
}
