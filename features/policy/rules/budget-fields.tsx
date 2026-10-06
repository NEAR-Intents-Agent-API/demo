import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Rules } from "./rules";

export function BudgetFields({
  rules,
  onChange,
  field,
}: {
  rules: Rules;
  onChange: (rules: Rules) => void;
  field?: keyof Rules["budget"];
}) {
  return (
    <div className={field ? "space-y-4" : "grid gap-4 @xl/rules:grid-cols-3"}>
      {(
        [
          ["dailyUsd", "Per 24 hours"],
          ["weeklyUsd", "Per 7 days"],
          ["monthlyUsd", "Per 30 days"],
        ] as const
      )
        .filter(([key]) => !field || key === field)
        .map(([key, label]) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={`policy-${key}`}>{field ? "Spending cap" : label} (USD)</Label>
            <Input
              id={`policy-${key}`}
              inputMode="decimal"
              placeholder="No cap"
              value={rules.budget[key]}
              onChange={(event) =>
                onChange({ ...rules, budget: { ...rules.budget, [key]: event.target.value } })
              }
            />
          </div>
        ))}
    </div>
  );
}
