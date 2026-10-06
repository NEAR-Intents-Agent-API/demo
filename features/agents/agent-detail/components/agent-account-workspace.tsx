"use client";

import type { AgentView } from "@near-intents-agent-api/sdk";
import { DialogBusyContext } from "@/components/shared/dialog-busy-context";
import { Unavailable } from "@/components/shared/states";
import { FundsProvider, FundsWorkspace } from "@/features/funds/index";
import { useDialogBusyTarget } from "@/hooks/use-dialog-busy";
import { AgentBackLink } from "../../components/agent-back-link";
import type { AgentState } from "../../model/agent-state";
import { useAgentTab } from "../hooks/use-agent-tab";
import { useWalletSetup } from "../hooks/use-wallet-setup";
import { useWalletTab } from "../hooks/use-wallet-tab";
import { AccountFundsPanel } from "./account-funds-panel";
import { AccountSetupBanner } from "./account-setup-banner";
import { AccountSetupDialog } from "./account-setup-dialog";
import { AgentAccountTabs } from "./agent-account-tabs";
import { AgentConnectionsSummary } from "./agent-connections-summary";
import { AgentHeader } from "./agent-header";

/** Keep balances and money-moving drafts above tabs and setup steps. */
export function AgentAccountWorkspace({
  agent,
  state,
  accessPage,
  refreshing,
  onRefresh,
  error,
}: {
  agent: AgentView;
  state: AgentState;
  accessPage: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  error?: string;
}) {
  const navigation = useAgentTab(
    accessPage ? `/agents/${encodeURIComponent(agent.id)}` : undefined,
  );
  const view = useWalletTab(agent, {
    activity: () => navigation.setTab("activity"),
    rules: () => navigation.setTab("rules"),
    connect: () => navigation.setSetupStep("connect"),
  });
  const lock = useDialogBusyTarget(view.accessFlow.active);
  const setup = useWalletSetup(agent.id, {
    activated: () => navigation.setSetupStep("live"),
    deposit: () => navigation.setSetupStep("fund"),
    access: () => navigation.setSetupStep("access"),
    connect: () => navigation.setSetupStep("connect"),
  });

  return (
    <DialogBusyContext.Provider value={lock.value}>
      <FundsProvider value={view.funds}>
        <FundsWorkspace
          portfolio={{
            lane: view.lane,
            onLane: view.setLane,
            holdings: view.active.holdings,
            loading: view.active.query.isPending || view.catalog.query.isPending,
            error: view.active.query.error?.message ?? null,
            onRetry: () => void view.active.query.refetch(),
            account: view.active.nearAccountId,
            catalog: view.catalog,
            onManageFunds: navigation.openFunds,
            fundsOpen: navigation.fundsOpen,
            embedded: true,
          }}
          flow={view.flow}
          onFlow={view.setFlow}
          balanceLocked={lock.locked}
          setupFunding={navigation.setup === "fund"}
          onManage={view.accessFlow.openForm}
          onRevoke={view.accessFlow.revoke}
          revoking={view.accessFlow.revoking}
        >
          {({ portfolio, balanceSwitch, actions, deposit, busy }) => (
            <>
              <div className="flex min-w-0 flex-col gap-5">
                <AgentBackLink />
                <div className="grid min-w-0 items-center gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem] [&>fieldset]:w-full [&>fieldset]:self-center">
                  <div className="min-w-0">
                    <AccountSetupBanner setup={setup} busy={busy || lock.locked} />
                  </div>
                  {balanceSwitch}
                </div>
                <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
                  <div className="flex min-w-0 flex-col gap-6 lg:col-start-1 lg:row-start-1">
                    <AgentHeader
                      agent={agent}
                      state={state}
                      refreshing={refreshing || view.refreshing}
                      onRefresh={() => void view.refresh()}
                      framed
                    />
                    {error ? <Unavailable code={error} onRetry={onRefresh} /> : null}
                    <AgentAccountTabs
                      agent={agent}
                      navigation={navigation}
                      disabled={busy || lock.locked}
                    />
                  </div>
                  <aside
                    className="flex min-w-0 flex-col gap-5 lg:col-start-2 lg:row-start-1"
                    aria-label="Balance and connections"
                  >
                    <section className="min-w-0 rounded-xl border bg-card p-5" aria-label="Balance">
                      {portfolio}
                    </section>
                    <AgentConnectionsSummary
                      agentId={agent.id}
                      clients={setup.clients}
                      busy={busy || lock.locked}
                    />
                  </aside>
                </div>
              </div>
              {navigation.fundsOpen ? (
                <AccountFundsPanel
                  actions={actions}
                  busy={busy || lock.locked}
                  onClose={navigation.closeFunds}
                />
              ) : null}
              {navigation.setup ? (
                <AccountSetupDialog
                  agent={agent}
                  step={navigation.setup}
                  setup={setup}
                  deposit={deposit}
                  busy={busy || view.accessFlow.active}
                  onStep={navigation.setSetupStep}
                  onClose={navigation.closeSetup}
                />
              ) : null}
            </>
          )}
        </FundsWorkspace>
        {view.accessFlow.dialogs()}
      </FundsProvider>
    </DialogBusyContext.Provider>
  );
}
