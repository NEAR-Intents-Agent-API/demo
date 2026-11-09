import { limitOrderDefaultDeviationBps } from "@/lib/agent-api/schemas";
import { deviationPercent } from "../../rules/limit-order-field";
import type { Ability, Rules } from "../../rules/rules";

export function AbilitySettingValue({ ability, rules }: { ability: Ability; rules: Rules }) {
  const enabled = rules.abilities[ability];
  return (
    <span className={enabled ? "text-success" : "text-muted-foreground"}>
      {enabled ? "Allowed" : "Off"}
      {enabled && ability === "limit_order" ? (
        <span className="text-muted-foreground">
          {" "}
          · within{" "}
          {deviationPercent(
            rules.limitOrderDeviationBps.trim() || String(limitOrderDefaultDeviationBps),
          )}{" "}
          of market
        </span>
      ) : null}
    </span>
  );
}
