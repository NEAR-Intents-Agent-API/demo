"use client";

import { useId, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export function useOptionSelect<T extends string>({
  options,
  onChange,
  disabled,
  open: controlledOpen,
  onOpenChange,
}: {
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const labelId = useId();
  const mobile = useIsMobile();
  const [localOpen, setLocalOpen] = useState(false);
  const setOpen = (open: boolean) => {
    if (open && disabled) return;
    setLocalOpen(open);
    onOpenChange?.(open);
  };
  const pick = (next: string) => {
    const option = options.find((item) => item.value === next);
    if (!option || disabled) return;
    onChange(option.value);
    setOpen(false);
  };
  return { labelId, mobile, open: !disabled && (controlledOpen ?? localOpen), setOpen, pick };
}
