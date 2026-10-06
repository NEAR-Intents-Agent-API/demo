"use client";
import type { ComponentProps, ReactNode } from "react";
import { Portfolio } from "../portfolio/portfolio";
import { PortfolioLaneSwitch } from "../portfolio/portfolio-lane-switch";
import type { FlowId } from "./flow-options";
import { effectiveFlow } from "./flow-state-utils";
import { MoveFunds } from "./move-funds";
import { SetupDeposit } from "./setup-deposit";
import { useFundsFlows } from "./use-funds-flows";
import { useMoreActions } from "./use-more-actions";

export function FundsWorkspace({
  portfolio,
  flow,
  onFlow,
  balanceLocked,
  children,
  setupFunding = false,
  ...access
}: {
  portfolio: Omit<ComponentProps<typeof Portfolio>, "laneDisabled" | "onAddFunds">;
  flow: FlowId | null;
  onFlow: (flow: FlowId | null) => void;
  balanceLocked: boolean;
  onManage: () => void;
  onRevoke: () => void;
  revoking: boolean;
  children: (panels: {
    portfolio: ReactNode;
    balanceSwitch: ReactNode;
    actions: ReactNode;
    deposit: ReactNode;
    busy: boolean;
  }) => ReactNode;
  setupFunding?: boolean;
}) {
  const [moreActions, setMoreActions] = useMoreActions();
  const selectedFlow = setupFunding ? "deposit" : effectiveFlow(flow, moreActions);
  const controller = useFundsFlows(portfolio.lane, selectedFlow, onFlow, portfolio.onLane);
  return children({
    balanceSwitch: (
      <PortfolioLaneSwitch
        lane={portfolio.lane}
        onLane={controller.changeLane}
        disabled={controller.busy || balanceLocked}
      />
    ),
    portfolio: (
      <Portfolio
        {...portfolio}
        showLaneSwitch={false}
        onLane={controller.changeLane}
        laneDisabled={controller.busy || balanceLocked}
        onAddFunds={
          portfolio.onManageFunds
            ? () => {
                if (controller.busy || balanceLocked) return;
                controller.openFlow("deposit");
                portfolio.onManageFunds?.();
              }
            : undefined
        }
      />
    ),
    actions: (
      <MoveFunds
        {...access}
        flow={selectedFlow}
        moreActions={moreActions}
        onMoreActions={(next) => {
          setMoreActions(next);
          if (!next) controller.openFlow("deposit");
        }}
        views={controller.views}
        onSelectFlow={controller.openFlow}
      />
    ),
    deposit: (
      <SetupDeposit
        view={controller.views.deposit}
        onLane={controller.changeLane}
        busy={controller.busy}
      />
    ),
    busy: controller.busy,
  });
}
