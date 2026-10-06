import type { AgentView } from "@near-intents-agent-api/sdk";
import { MonoId } from "@/components/shared/identifiers";

export function AccountOwnerIdentity({ owner }: { owner: AgentView["owner"] }) {
  if (!owner) return <span className="text-muted-foreground">No owner signature recorded</span>;
  const identifier =
    owner.type === "near"
      ? owner.account_id
      : owner.type === "evm"
        ? owner.address
        : owner.credential_id;
  return (
    <>
      <span className="text-muted-foreground">{owner.type}</span>
      <MonoId
        value={identifier}
        head={12}
        tail={6}
        className="max-w-full text-xs"
        label="Copy owner identifier"
      />
      {owner.type === "evm" ? (
        <span className="text-muted-foreground">Chain {owner.chain_id}</span>
      ) : owner.type === "passkey" ? (
        <span className="max-w-full break-all text-muted-foreground">{owner.rp_id}</span>
      ) : null}
    </>
  );
}
