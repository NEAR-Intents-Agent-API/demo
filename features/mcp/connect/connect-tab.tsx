"use client";
import { Panel } from "@/components/shared/page";
import { SetupFlowPanel } from "@/components/shared/setup-flow-panel";
import { Loading, Unavailable } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { useDialogBusy, useDialogLocked } from "@/hooks/use-dialog-busy";
import { useMcpClients } from "../hooks/use-mcp-clients";
import { ApiKeyDialog } from "./api-key-dialog";
import { ConnectInstructions } from "./connect-instructions";
import { ConnectedClientsPanel } from "./connected-clients-panel";

/**
 * How a client — Codex, OpenClaw, any MCP tool — gets its own access to this account. The
 * endpoint is shared; every client signs its own grant, so revoking one leaves the rest working.
 */
export function ConnectTab({
  agentId,
  setup,
  plain = false,
}: {
  agentId: string;
  setup?: { onBack: () => void; onFinish: () => void };
  plain?: boolean;
}) {
  const { view, revoke, dialog, setDialog } = useMcpClients(agentId);
  useDialogBusy(revoke.isPending || Boolean(dialog));
  const locked = useDialogLocked();
  if (view.isPending) return <Loading rows={2} />;
  if (!view.data || view.error)
    return (
      <Unavailable
        code={view.error?.message ?? "request_failed"}
        onRetry={() => void view.refetch()}
      />
    );
  const instructions = (
    <ConnectInstructions endpoint={view.data.endpoint} onApiKey={() => setDialog({})} />
  );
  return (
    <div
      className={
        plain
          ? "flex min-w-0 flex-col gap-5"
          : "grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
      }
    >
      {setup ? (
        <SetupFlowPanel
          plain={plain}
          hideHeading={plain}
          step={5}
          title="Connect a client"
          description="MCP gives your client tools for this account. Each connection needs a separate signed spending grant."
          footer={
            <Button
              disabled={
                locked || !view.data.clients.some((client) => client.status === "authorized")
              }
              onClick={setup.onFinish}
            >
              Finish setup
            </Button>
          }
        >
          {instructions}
        </SetupFlowPanel>
      ) : plain ? (
        instructions
      ) : (
        <Panel
          title="Connect a client"
          description="MCP gives an AI client tools to read and manage this account. Each client needs separate signed spending permission."
        >
          {instructions}
        </Panel>
      )}
      <ConnectedClientsPanel
        plain={plain}
        clients={view.data.clients}
        pendingId={revoke.isPending ? revoke.variables : undefined}
        error={revoke.error?.message}
        onRevoke={(id) => revoke.mutate(id)}
        onResume={(client) => setDialog({ client })}
        onRefresh={() => void view.refetch()}
        refreshing={view.isFetching || locked}
      />
      {dialog ? (
        <ApiKeyDialog
          key={dialog.client?.id ?? "new"}
          agentId={agentId}
          client={dialog.client}
          open
          onOpenChange={(open) => {
            if (!open) setDialog(null);
          }}
        />
      ) : null}
    </div>
  );
}
