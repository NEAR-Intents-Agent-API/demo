"use client";

import { DepositFlow } from "../deposit/deposit-flow";
import type { useDepositFlow } from "../deposit/use-deposit-flow";
import { FlowFooterContext } from "./flow-footer-context";
import { SetupDepositFooter } from "./setup-deposit-footer";
import { useSetupDeposit } from "./use-setup-deposit";

export function SetupDeposit({
  view,
  busy,
}: {
  view: ReturnType<typeof useDepositFlow>;
  busy: boolean;
}) {
  const { navigation, flowFooterTarget, disabled } = useSetupDeposit(busy);
  return (
    <div className="flex flex-col gap-4">
      <FlowFooterContext.Provider value={navigation ? false : flowFooterTarget}>
        <DepositFlow view={view} />
      </FlowFooterContext.Provider>
      {navigation ? (
        <SetupDepositFooter view={view} navigation={navigation} disabled={disabled} />
      ) : null}
    </div>
  );
}
