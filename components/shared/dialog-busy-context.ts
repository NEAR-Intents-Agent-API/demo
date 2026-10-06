"use client";

import { createContext } from "react";

export const DialogBusyContext = createContext<{
  busy: boolean;
  setBusy: (busy: boolean) => void;
} | null>(null);
