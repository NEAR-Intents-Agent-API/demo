"use client";

import { Button } from "@/components/ui/button";
import type { useMcpAgent } from "@/features/mcp/data";
import { ConnectClientDialog } from "@/features/mcp/index";
import { useDetailsDialog } from "@/hooks/use-details-dialog";

export function AgentConnectionsSummary({
  clients,
  agentId,
  busy,
}: {
  clients: ReturnType<typeof useMcpAgent>;
  agentId: string;
  busy: boolean;
}) {
  const dialog = useDetailsDialog();
  const authorized =
    clients.data?.clients.filter((client) => client.status === "authorized").length ?? 0;
  const pending = clients.data?.clients.filter((client) => client.status === "pending").length ?? 0;
  const unavailable = clients.isPending || Boolean(clients.error) || !clients.data;
  return (
    <>
      <section
        className="flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-5"
        aria-label="MCP connections"
      >
        <header className="flex h-8 items-center justify-between gap-2">
          <h2 className="text-sm font-medium">Connected MCP clients</h2>
        </header>
        <div>
          <p className="text-3xl font-medium tracking-tight tabular-nums">
            {unavailable ? "—" : authorized}
          </p>
          <p
            className="mt-1 text-xs text-muted-foreground"
            role={clients.error ? "alert" : undefined}
          >
            {clients.isPending
              ? "Reading connected clients…"
              : unavailable
                ? "Connections unavailable"
                : `${authorized} authorized · each connection has its own grant.`}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button
            ref={dialog.triggerRef}
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => dialog.setOpen(true)}
            disabled={busy}
            aria-haspopup="dialog"
            aria-expanded={dialog.open}
          >
            Connect client
          </Button>
          {!unavailable && pending > 0 ? (
            <span className="text-xs text-muted-foreground">{pending} awaiting authorization</span>
          ) : null}
        </div>
        {!unavailable && authorized === 0 ? (
          <p className="text-xs text-muted-foreground">No clients connected</p>
        ) : null}
      </section>
      {dialog.open ? (
        <ConnectClientDialog
          agentId={agentId}
          onOpenChange={dialog.setOpen}
          returnFocus={dialog.triggerRef}
        />
      ) : null}
    </>
  );
}
