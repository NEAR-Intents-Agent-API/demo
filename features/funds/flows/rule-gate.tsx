"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import type { Ability } from "@/features/policy/model";
import { ABILITY_INFO } from "@/features/policy/model";
import { useFunds } from "../funds-context";

/**
 * Shown in place of a flow the agent's rules forbid. The provider would refuse it anyway, so the
 * honest screen says so up front and points at the one place that can change it.
 */
export function RuleGate({ ability }: { ability: Ability }) {
  const funds = useFunds();
  const info = ABILITY_INFO[ability];
  return (
    <div className="flex flex-col items-start gap-4 py-4">
      <span className="flex text-muted-foreground">
        <HugeiconsIcon icon={info.icon} className="size-5" />
      </span>
      <div className="flex flex-col gap-1.5">
        <p className="text-base font-medium">{info.off}</p>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">{info.description}</p>
      </div>
      <Button variant="outline" onClick={funds.openRules}>
        Change the rules
      </Button>
    </div>
  );
}
