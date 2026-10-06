"use client";

import { useRef, useState } from "react";

export function useAccountDetailsDialog() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement | null>(null);
  return { open, setOpen, trigger, show: () => setOpen(true) };
}
