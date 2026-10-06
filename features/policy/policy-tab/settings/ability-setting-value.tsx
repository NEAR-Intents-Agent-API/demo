import type { Ability, Rules } from "../../rules/rules";

export function AbilitySettingValue({ ability, rules }: { ability: Ability; rules: Rules }) {
  const enabled = rules.abilities[ability];
  return (
    <span className={enabled ? "text-success" : "text-muted-foreground"}>
      {enabled ? "Allowed" : "Off"}
    </span>
  );
}
