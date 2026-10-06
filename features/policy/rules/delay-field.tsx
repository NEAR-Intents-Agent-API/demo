import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Rules } from "./rules";

export function DelayField({
  rules,
  onChange,
}: {
  rules: Rules;
  onChange: (rules: Rules) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="policy-delay">Execution delay (seconds)</Label>
      <Input
        id="policy-delay"
        type="number"
        min={0}
        max={30 * 24 * 60 * 60}
        step={1}
        value={rules.delaySeconds}
        onChange={(event) => onChange({ ...rules, delaySeconds: event.target.value })}
      />
      <p className="max-w-2xl text-xs leading-5 text-muted-foreground">
        0 means no delay. Saving rule changes invalidates queued executions.
      </p>
    </div>
  );
}
