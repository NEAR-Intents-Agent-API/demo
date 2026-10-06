"use client";

import { Choice } from "@/components/shared/choice";
import { DepositFlow } from "../deposit/deposit-flow";
import type { useDepositFlow } from "../deposit/use-deposit-flow";
import type { Lane } from "../portfolio/portfolio";
import { FlowFooterContext } from "./flow-footer-context";
import { SetupDepositFooter } from "./setup-deposit-footer";
import { useSetupDeposit } from "./use-setup-deposit";

export function SetupDeposit({
  view,
  onLane,
  busy,
}: {
  view: ReturnType<typeof useDepositFlow>;
  onLane: (lane: Lane) => void;
  busy: boolean;
}) {
  const { navigation, flowFooterTarget, disabled } = useSetupDeposit(busy);
  return (
    <div className="flex flex-col gap-4">
      {view.source === "network" ? (
        <Choice
          label="Deposit balance"
          className="w-full"
          value={view.form.lane}
          disabled={busy || Boolean(view.tracking)}
          onChange={(lane) => onLane(lane === "private" ? "confidential" : "public")}
          options={[
            { value: "public", label: "Public" },
            { value: "private", label: "Private" },
          ]}
        />
      ) : null}
      <FlowFooterContext.Provider value={navigation ? false : flowFooterTarget}>
        <DepositFlow view={view} />
      </FlowFooterContext.Provider>
      {navigation ? (
        <SetupDepositFooter view={view} navigation={navigation} disabled={disabled} />
      ) : null}
    </div>
  );
}
