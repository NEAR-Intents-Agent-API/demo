"use client";
import { HugeiconsIcon } from "@hugeicons/react";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccessStatus } from "../access/access-status";
import { DepositFlow } from "../deposit/deposit-flow";
import { useFunds } from "../funds-context";
import { PrivateFlow } from "../private/private-flow";
import { SendFlow } from "../send/send-flow";
import { SwapFlow } from "../swap/swap-flow";
import { WithdrawFlow } from "../withdraw/withdraw-flow";
import { FLOWS, type FlowId } from "./flow-options";
import { canSwitchFundsFlow, effectiveFlow } from "./flow-state-utils";
import type { FundsViews } from "./use-funds-flows";

export type { FlowId } from "./flow-options";

export function MoveFunds({
  flow,
  onSelectFlow,
  moreActions,
  onMoreActions,
  views,
  onManage,
  onRevoke,
  revoking,
}: {
  flow: FlowId | null;
  onSelectFlow: (flow: FlowId) => void;
  moreActions: boolean;
  onMoreActions: (enabled: boolean) => void;
  views: FundsViews;
  onManage: () => void;
  onRevoke: () => void;
  revoking: boolean;
}) {
  const funds = useFunds();
  const selectedFlow = effectiveFlow(flow, moreActions);
  const busy =
    selectedFlow === "deposit"
      ? views.deposit.form.action.isPending
      : views[selectedFlow].action.isPending;
  return (
    <section className="min-w-0" aria-label="Move funds">
      <Tabs
        value={selectedFlow}
        onValueChange={(value) => {
          const next = FLOWS.find((item) => item.id === value);
          if (next && canSwitchFundsFlow(busy)) onSelectFlow(next.id);
        }}
        className="w-full min-w-0 gap-4"
      >
        {moreActions ? (
          <TabsList
            aria-label="Ways to move funds"
            className="grid w-full max-w-full grid-cols-5 gap-1 group-data-horizontal/tabs:h-auto"
          >
            {FLOWS.map((item) => (
              <TabsTrigger
                key={item.id}
                value={item.id}
                disabled={busy && item.id !== selectedFlow}
                className="min-w-0 flex-col gap-1 px-0.5 text-[11px] group-data-[variant=default]/tabs-list:h-auto group-data-[variant=default]/tabs-list:px-0.5 group-data-[variant=default]/tabs-list:py-2 group-data-[variant=default]/tabs-list:text-[11px] sm:text-xs focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2"
              >
                <HugeiconsIcon icon={item.icon} className="size-4" />
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        ) : null}
        <div className="min-w-0">
          <TabsContent value="deposit" className="m-0">
            <DepositFlow view={views.deposit} />
          </TabsContent>
          {moreActions ? (
            <>
              <TabsContent value="swap" className="m-0">
                <SwapFlow view={views.swap} />
              </TabsContent>
              <TabsContent value="send" className="m-0">
                <SendFlow view={views.send} />
              </TabsContent>
              <TabsContent value="withdraw" className="m-0">
                <WithdrawFlow view={views.withdraw} />
              </TabsContent>
              <TabsContent value="private" className="m-0">
                <PrivateFlow view={views.private} />
              </TabsContent>
            </>
          ) : null}
          <div className="mt-5 border-t pt-1">
            <Switch
              checked={moreActions}
              onChange={onMoreActions}
              disabled={busy}
              label="More actions"
              description="Swap, transfer, withdraw and shield. These spend from the account and need dashboard authorization; deposits don't."
            />
          </div>
          {funds.access ? (
            <div className="border-t mt-2 pt-4">
              <AccessStatus
                access={funds.access}
                onManage={onManage}
                onDestinations={() => funds.manageDestinations()}
                onRevoke={onRevoke}
                revoking={revoking}
              />
            </div>
          ) : null}
        </div>
      </Tabs>
    </section>
  );
}
