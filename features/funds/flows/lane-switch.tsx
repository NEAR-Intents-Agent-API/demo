"use client";

import { Choice } from "@/components/shared/choice";
import { useFunds } from "../funds-context";

import type { BalanceLane } from "./flow-parts";

export function LaneSwitch({
  value,
  onChange,
  label = "Balance",
  publicLabel = "Public",
  privateLabel = "Private",
  alwaysVisible = false,
}: {
  value: BalanceLane;
  onChange: (lane: BalanceLane) => void;
  label?: string;
  publicLabel?: string;
  privateLabel?: string;
  alwaysVisible?: boolean;
}) {
  const funds = useFunds();
  if (!alwaysVisible && funds.rules?.abilities.confidential === false)
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{publicLabel}</span>
      </div>
    );
  return (
    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Choice<BalanceLane>
        label={label}
        className="w-full sm:w-auto"
        value={value}
        onChange={onChange}
        options={[
          { value: "public", label: publicLabel },
          { value: "private", label: privateLabel },
        ]}
      />
    </div>
  );
}
