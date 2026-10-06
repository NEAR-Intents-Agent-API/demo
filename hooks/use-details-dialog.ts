"use client";

import { useRef, useState } from "react";

export function useDetailsDialog() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  return { open, setOpen, triggerRef };
}
