"use client";

import { createContext } from "react";

export type SetupNavigation = {
  onBack: () => void;
  onContinue: () => void;
  continueLabel: string;
};

export const SetupNavigationContext = createContext<SetupNavigation | null>(null);
