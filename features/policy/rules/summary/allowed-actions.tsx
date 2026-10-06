import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import { ABILITY_INFO } from "../abilities";
import { ABILITIES, type Rules } from "../rules";

export function AllowedActions({ rules }: { rules: Rules }) {
  return (
    <section className="min-w-0">
      <h3 className="mb-3 text-sm font-medium">Allowed actions</h3>
      <ul className="divide-y">
        {ABILITIES.map((ability) => {
          const info = ABILITY_INFO[ability];
          const on = rules.abilities[ability];
          return (
            <li key={ability} className="flex min-h-12 items-center justify-between gap-3 py-3">
              <span
                className={cn(
                  "flex min-w-0 items-center gap-2.5 text-sm",
                  !on && "text-muted-foreground",
                )}
              >
                <HugeiconsIcon icon={info.icon} className="size-4 shrink-0 text-muted-foreground" />
                <span className="font-medium">{info.title}</span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1 text-xs text-muted-foreground">
                <span className={on ? "text-foreground" : undefined}>{on ? "Allowed" : "Off"}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
