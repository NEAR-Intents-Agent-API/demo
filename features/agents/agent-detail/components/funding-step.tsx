"use client";

import type { ReactNode } from "react";
import { SetupFlowPanel } from "@/components/shared/setup-flow-panel";
import { SetupNavigationContext } from "@/components/shared/setup-navigation-context";

export function FundingStep({
  children,
  funded,
  onBack,
  onContinue,
  plain = false,
}: {
  children: ReactNode;
  funded: boolean;
  onBack: () => void;
  onContinue: () => void;
  plain?: boolean;
}) {
  return (
    <SetupFlowPanel
      plain={plain}
      hideHeading={plain}
      step={3}
      title="Add funds"
      description={
        plain ? undefined : "Deposit from a network or transfer from another NEAR Intents account."
      }
    >
      <SetupNavigationContext.Provider
        value={{ onBack, onContinue, continueLabel: funded ? "Continue" : "Continue setup" }}
      >
        {children}
      </SetupNavigationContext.Provider>
      <p className="text-xs text-muted-foreground">
        {funded ? "Funds available" : "You can add funds later"}
      </p>
    </SetupFlowPanel>
  );
}
