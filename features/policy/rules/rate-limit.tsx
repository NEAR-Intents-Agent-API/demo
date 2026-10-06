import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Rules } from "./rules";

export function RateLimit({ rules, onChange }: { rules: Rules; onChange: (rules: Rules) => void }) {
  const id = useId();
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Moves per hour</Label>
      <Input
        id={id}
        inputMode="numeric"
        value={rules.maxPerHour}
        placeholder="No cap"
        aria-label="Most money moves per hour"
        onChange={(event) =>
          onChange({ ...rules, maxPerHour: event.target.value.replace(/[^0-9]/g, "") })
        }
        className="tabular-nums"
      />
      <p className="text-xs leading-5 text-muted-foreground">Leave empty for no hourly cap.</p>
    </div>
  );
}
