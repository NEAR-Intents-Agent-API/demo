"use client";

import { useState } from "react";

export function usePortfolioDialog() {
  const [open, setOpen] = useState(false);
  return { open, setOpen, show: () => setOpen(true) };
}
