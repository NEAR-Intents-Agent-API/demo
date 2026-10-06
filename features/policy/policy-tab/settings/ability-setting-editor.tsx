import { Switch } from "@/components/ui/switch";
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
    <Switch
      label="Enabled"
      checked={rules.abilities[ability]}
      className="py-0"
      onChange={(checked) =>
        onChange({ ...rules, abilities: { ...rules.abilities, [ability]: checked } })
      }
    />
  );
}
