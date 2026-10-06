"use client";
import { useState } from "react";

/** Opening or dismissing a picker never changes the current form selection. */
export function usePickerDialog<T>(onChange: (value: T) => void) {
  const [open, setOpen] = useState(false);
  const pick = (value: T) => {
    onChange(value);
    setOpen(false);
  };
  return { open, setOpen, pick };
}
