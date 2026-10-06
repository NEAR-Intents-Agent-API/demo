"use client";
import { Loading, Unavailable } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { GrantRules } from "@/features/policy";
import { errorMessage } from "@/lib/http/messages";
import { useMcpConsent } from "../hooks/use-mcp-consent";

export function ConsentPanel({
  agentId,
  clientId,
  oauthQuery,
}: {
  agentId: string;
  clientId: string;
  scope: string;
  oauthQuery: string;
}) {
  const { agent, client, authorize, deny, error, disabled, label } = useMcpConsent(
    agentId,
    clientId,
    oauthQuery,
  );
  return (
    <main className="console-shell flex min-h-svh items-center justify-center p-4 sm:p-6">
      <div className="console-panel w-full max-w-lg rounded-lg p-6 space-y-5">
        <div>
          <p className="console-eyebrow">MCP authorization</p>
          <h1 className="console-title mt-2 text-xl">
            Connect {client.data?.client_name ?? clientId}?
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            MCP lets this AI client use tools on {agent.data?.name ?? "this agent account"}. Your
            signature grants spending permission, separately from signing in or authorizing the
            dashboard.
          </p>
        </div>
        {agent.isPending ? (
          <Loading rows={1} />
        ) : agent.error ? (
          <Unavailable code={agent.error.message} />
        ) : (
          <>
            <p className="text-sm">
              Read balances, rules and history, and create deposit addresses. Policy changes and
              owner signing stay with you. Granting access does not send funds.
            </p>
            <GrantRules agentId={agentId} holder={client.data?.client_name ?? "this client"} />
            <p className="text-xs text-muted-foreground">
              Client access expires after 30 days; reconnect with a new signed grant to renew it.
            </p>
          </>
        )}
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {errorMessage(error.message)}
          </p>
        ) : null}
        {authorize.data?.authorized && !authorize.data.redirect_uri ? (
          <p role="status" className="text-sm">
            Client already authorized. Retry connection from your MCP client.
          </p>
        ) : null}
        <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row-reverse">
          <Button
            size="lg"
            className="sm:ml-auto"
            disabled={disabled}
            onClick={() =>
              authorize.mutate(
                {},
                {
                  onSuccess: (result) => {
                    if (result.redirect_uri) window.location.assign(result.redirect_uri);
                  },
                },
              )
            }
          >
            {label}
          </Button>
          <Button
            variant="link"
            disabled={authorize.isPending || deny.isPending}
            onClick={() => deny.mutate()}
          >
            Deny
          </Button>
        </div>
      </div>
    </main>
  );
}
