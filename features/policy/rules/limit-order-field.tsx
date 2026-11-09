import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { limitOrderDefaultDeviationBps, limitOrderDeviationCapBps } from "@/lib/agent-api/schemas";
import type { Rules } from "./rules";

/** Basis points as the percent an owner thinks in: 100 is 1%. */
export const deviationPercent = (bps: string) => `${Number(bps) / 100}%`;

/**
 * How far a limit order's price may sit from the market. The rules model keeps the typed basis
 * points; empty means the API's default.
 */
export function LimitOrderField({
  rules,
  onChange,
}: {
  rules: Rules;
  onChange: (rules: Rules) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="policy-limit-order-deviation">Price bound (basis points)</Label>
      <Input
        id="policy-limit-order-deviation"
        type="number"
        inputMode="numeric"
        min={0}
        max={limitOrderDeviationCapBps}
        step={1}
        value={rules.limitOrderDeviationBps}
        placeholder={String(limitOrderDefaultDeviationBps)}
        className="tabular-nums"
        onChange={(event) => onChange({ ...rules, limitOrderDeviationBps: event.target.value })}
      />
      <p className="max-w-2xl text-xs leading-5 text-muted-foreground">
        A sell may be priced at most this far below the market and a buy at most this far above it;
        a better price is never limited. 100 basis points is 1%, the most you can allow is{" "}
        {limitOrderDeviationCapBps}. Left empty it is {limitOrderDefaultDeviationBps}. Switching
        limit orders off cancels the orders still resting.
      </p>
    </div>
  );
}
