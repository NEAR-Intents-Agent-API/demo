import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { DELAY_UNITS, type DelayUnit, delayInput, delaySecondsFrom } from "@/lib/format/delay";
import type { Rules } from "./rules";

/**
 * The execution delay in minutes, hours or days. The rules model keeps seconds; the owner never
 * has to convert.
 */
export function DelayField({
  rules,
  onChange,
}: {
  rules: Rules;
  onChange: (rules: Rules) => void;
}) {
  const [input, setInput] = useState(() => delayInput(rules.delaySeconds));
  const edit = (amount: string, unit: DelayUnit) => {
    setInput({ amount, unit });
    onChange({ ...rules, delaySeconds: delaySecondsFrom(amount, unit) });
  };
  return (
    <div className="space-y-2">
      <Label htmlFor="policy-delay">Execution delay</Label>
      <div className="flex gap-2">
        <Input
          id="policy-delay"
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={input.amount}
          placeholder="0"
          className="tabular-nums"
          onChange={(event) => edit(event.target.value, input.unit)}
        />
        <NativeSelect
          aria-label="Execution delay unit"
          value={input.unit}
          onChange={(event) => edit(input.amount, event.target.value as DelayUnit)}
        >
          {DELAY_UNITS.map((unit) => (
            <NativeSelectOption key={unit.id} value={unit.id}>
              {unit.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <p className="max-w-2xl text-xs leading-5 text-muted-foreground">
        Every swap, transfer and withdrawal waits this long before it runs, and you can cancel it
        while it waits. Deposits are never delayed. Leave 0 for no delay; the longest is 30 days.
        Saving rule changes invalidates executions already waiting.
      </p>
    </div>
  );
}
