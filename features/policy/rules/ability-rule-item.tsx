"use client";

import { Switch } from "@/components/ui/switch";
import { ABILITY_INFO } from "./abilities";
import type { Ability } from "./rules";

export function AbilityRuleItem({
  ability,
  on,
  onToggle,
}: {
  ability: Ability;
  on: boolean;
  onToggle: () => void;
}) {
  const info = ABILITY_INFO[ability];
  return (
    <div className="flex min-w-0 flex-col gap-3 py-3">
      <Switch
        className="py-0"
        checked={on}
        onChange={onToggle}
        label={info.title}
        description={info.description}
      />
    </div>
  );
}
