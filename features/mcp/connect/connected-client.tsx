"use client";
import { StatusPill } from "@/components/shared/status";
import { Button } from "@/components/ui/button";
import type { McpClientView } from "../api";
import { ClientGrantDetails } from "./client-grant-details";

export function ConnectedClient({
  client,
  pending,
  onRevoke,
  onResume,
}: {
  client: McpClientView;
  pending: boolean;
  onRevoke: () => void;
  onResume: () => void;
}) {
  const tone = {
    authorized: "ok",
    pending: "attention",
    revoked: "blocked",
    expired: "blocked",
  } as const;
  const revokeLabel = client.revocationPending ? "Finish revocation" : "Revoke";
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-4">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{client.name}</span>
          <StatusPill tone={tone[client.status]}>{client.status}</StatusPill>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          {client.authKind === "oauth" ? "OAuth" : "API key"}
          {" · "}
          {client.lastUsedAt
            ? `Last used ${new Date(client.lastUsedAt).toLocaleString()}`
            : "Not used yet"}
        </p>
        {client.revocationPending ? (
          <p className="text-xs text-warning">
            Access blocked. Finish revocation to remove its grant.
          </p>
        ) : null}
        <ClientGrantDetails client={client} />
      </div>
      <div className="flex flex-wrap gap-2">
        {client.status === "pending" && client.authKind === "api_key" ? (
          <Button variant="outline" size="sm" disabled={pending} onClick={onResume}>
            Finish authorization
          </Button>
        ) : null}
        {client.status !== "revoked" || client.revocationPending ? (
          <Button variant="outline" size="sm" disabled={pending} onClick={onRevoke}>
            {pending ? "Revoking…" : revokeLabel}
          </Button>
        ) : null}
      </div>
    </li>
  );
}
