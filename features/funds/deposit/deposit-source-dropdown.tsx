"use client";

import { OptionSelect } from "@/components/shared/option-select";
import { DEPOSIT_SOURCES, type DepositSource } from "./deposit-source-options";

export function DepositSourceDropdown({
  value,
  onChange,
  disabled,
  open,
  onOpenChange,
}: {
  value: DepositSource;
  onChange: (source: DepositSource) => void;
  disabled: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <OptionSelect
      label="Deposit from"
      description="Fund from a network or another NEAR Intents account."
      value={value}
      onChange={onChange}
      disabled={disabled}
      open={open}
      onOpenChange={onOpenChange}
      options={DEPOSIT_SOURCES}
    />
  );
}
