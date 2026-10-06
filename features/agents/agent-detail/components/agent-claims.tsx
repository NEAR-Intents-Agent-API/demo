import type { AgentView } from "@near-intents-agent-api/sdk";
import { MonoId } from "@/components/shared/identifiers";
import { AccountAuthorityRow } from "./account-authority-row";
import { AccountOwnerIdentity } from "./account-owner-identity";
import { AccountRecord } from "./account-record";

export function AgentClaims({ agent }: { agent: AgentView }) {
  return (
    <div className="min-w-0 space-y-4">
      <section className="space-y-3" aria-label="Authority and custody">
        <h2 className="text-sm font-medium">Authority and custody</h2>
        <dl className="min-w-0 divide-y">
          <AccountAuthorityRow
            label="Owner signer"
            description="Controls account rules and access."
            ready={Boolean(agent.owner)}
            status={agent.owner ? "bound" : "not bound"}
          >
            <AccountOwnerIdentity owner={agent.owner} />
          </AccountAuthorityRow>
          <AccountAuthorityRow
            label="API authorization"
            description="Key authorized to act for the owner."
            ready={Boolean(agent.owner_account)}
            status={agent.owner_account ? "resolved" : "not resolved"}
          >
            {agent.owner_account ? (
              <>
                <MonoId
                  value={agent.owner_account.account_id}
                  head={12}
                  tail={6}
                  className="max-w-full text-xs"
                  label="Copy authorization account"
                />
                <span className="text-muted-foreground">{agent.owner_account.authority}</span>
              </>
            ) : (
              <span className="text-muted-foreground">No derived key yet</span>
            )}
          </AccountAuthorityRow>
          <AccountAuthorityRow
            label="Custody wallet"
            description="Holds this account's funds."
            ready={Boolean(agent.wallet)}
            status={agent.wallet ? "provisioned" : "not provisioned"}
          >
            {agent.wallet ? (
              <MonoId
                value={agent.wallet.near_account_id}
                head={12}
                tail={6}
                className="max-w-full text-xs"
                label="Copy custody account"
              />
            ) : (
              <span className="text-muted-foreground">Held by the provider until bound</span>
            )}
          </AccountAuthorityRow>
        </dl>
        <p className="text-xs leading-5 text-muted-foreground">
          The owner cannot move funds directly. The custody provider enforces account rules.
        </p>
      </section>
      <AccountRecord agent={agent} />
    </div>
  );
}
