import { Panel } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/http/messages";
import type { McpClientView } from "../api";
import { ConnectedClient } from "./connected-client";

export function ConnectedClientsPanel({
  clients,
  pendingId,
  error,
  onRevoke,
  onResume,
  onRefresh,
  refreshing,
  plain = false,
}: {
  clients: McpClientView[];
  pendingId?: string;
  error?: string;
  onRevoke: (id: string) => void;
  onResume: (client: McpClientView) => void;
  onRefresh: () => void;
  refreshing: boolean;
  plain?: boolean;
}) {
  const authorized = clients.filter((client) => client.status === "authorized").length;
  return (
    <Panel
      plain={plain}
      title="Connected clients"
      className={plain ? "border-t pt-4" : undefined}
      actions={
        <>
          <span className="text-xs text-muted-foreground">{authorized} authorized</span>
          <Button variant="ghost" size="xs" onClick={onRefresh} disabled={refreshing}>
            {refreshing ? "Refreshing…" : "Refresh"}
          </Button>
        </>
      }
    >
      {clients.length ? (
        <ul className="divide-y">
          {clients.map((client) => (
            <ConnectedClient
              key={client.id}
              client={client}
              pending={pendingId === client.id}
              onRevoke={() => onRevoke(client.id)}
              onResume={() => onResume(client)}
            />
          ))}
        </ul>
      ) : (
        <p
          role="status"
          className="rounded-md bg-input/25 px-3 py-3 text-xs leading-5 text-muted-foreground"
        >
          No clients connected yet. Once approved, your client will appear here.
        </p>
      )}
      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          Access stays blocked. {errorMessage(error)} Retry to complete the revocation.
        </p>
      ) : null}
    </Panel>
  );
}
