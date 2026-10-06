"use client";

import { useState } from "react";

export function useDialogFooterTarget() {
  const [footerTarget, setFooterTarget] = useState<HTMLDivElement | null>(null);
  return { footerTarget, setFooterTarget };
}
