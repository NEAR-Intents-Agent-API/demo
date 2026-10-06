"use client";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GrantRules } from "@/features/policy";
import { errorMessage } from "@/lib/http/messages";
import type { McpClientView } from "../api";
import { useMcpKeyForm } from "../hooks/use-mcp-key-form";
import { IssuedKey } from "./issued-key";

export function ApiKeyDialog({
  agentId,
  open,
  onOpenChange,
  client,
}: {
  agentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: McpClientView;
}) {
  const { name, setName, authorize } = useMcpKeyForm(agentId, client);
  const clientAccessId = client?.id;
  const issued = Boolean(authorize.data?.authorized);

  const footer = issued ? null : (
    <div className="flex flex-col items-stretch gap-3 sm:items-end">
      {authorize.error ? (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage(authorize.error.message)}
        </p>
      ) : null}
      <Button
        size="lg"
        type="submit"
        form="mcp-key-form"
        className="w-full sm:w-auto"
        disabled={authorize.isPending}
      >
        {authorize.isPending ? "Authorizing client…" : "Sign grant and create client key"}
      </Button>
    </div>
  );

  return (
    <ResponsiveDialog
      busy={authorize.isPending}
      open={open}
      onOpenChange={(value) => {
        if (!authorize.isPending) onOpenChange(value);
      }}
      title="Authorize an MCP client"
      description="MCP lets an AI client call tools on this account. Sign a separate spending grant for this client, then copy its API key into the client configuration. Signing in alone does not authorize spending."
      footer={footer}
    >
      {issued ? (
        <IssuedKey token={authorize.data?.token ?? null} onDone={() => onOpenChange(false)} />
      ) : (
        <form
          id="mcp-key-form"
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (authorize.isPending) return;
            authorize.mutate({ name, clientAccessId });
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="mcp-client-name">Client name</Label>
            <Input
              id="mcp-client-name"
              placeholder="Codex, OpenClaw…"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required={!clientAccessId}
              maxLength={100}
              disabled={authorize.isPending}
            />
          </div>
          <GrantRules agentId={agentId} holder={name.trim() || "this client"} />
          <p className="text-xs text-muted-foreground">
            This client can also read balances, rules and history, and create deposit addresses.
            Client access expires after 30 days; reconnect with a new signed grant to renew it.
            Dashboard permission and other clients stay separate. All clients share the account's
            spending budget; a new connection does not add a new budget. Policy changes stay with
            you.
          </p>
        </form>
      )}
    </ResponsiveDialog>
  );
}
