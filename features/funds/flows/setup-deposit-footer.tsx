"use client";

import type { SetupNavigation } from "@/components/shared/setup-navigation-context";
import { SetupStepFooter } from "@/components/shared/setup-step-footer";
import { Pending } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import type { useDepositFlow } from "../deposit/use-deposit-flow";

export function SetupDepositFooter({
  view,
  navigation,
  disabled,
}: {
  view: ReturnType<typeof useDepositFlow>;
  navigation: SetupNavigation;
  disabled: boolean;
}) {
  const depositForm = view.source === "network" && !view.tracking;
  return (
    <SetupStepFooter
      busy={disabled}
      onSkip={depositForm ? navigation.onContinue : view.tracking ? view.finish : undefined}
      skipLabel={view.tracking ? "New deposit" : "Skip for now"}
    >
      {depositForm ? (
        <Button disabled={disabled || Boolean(view.form.reason)} onClick={view.form.create}>
          {view.form.action.isPending ? <Pending /> : null}
          {view.form.reason ??
            (view.form.action.isPending ? "Creating address…" : "Get deposit address")}
        </Button>
      ) : (
        <Button disabled={disabled} onClick={navigation.onContinue}>
          {navigation.continueLabel}
        </Button>
      )}
    </SetupStepFooter>
  );
}
