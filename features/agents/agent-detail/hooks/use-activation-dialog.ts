"use client";

import { useState } from "react";
import { useOnboarding } from "./use-onboarding";

export function useActivationDialog(agentId: string) {
  const [open, setOpen] = useState(false);
  const onboarding = useOnboarding(agentId);
  return { open, setOpen, onboarding };
}
