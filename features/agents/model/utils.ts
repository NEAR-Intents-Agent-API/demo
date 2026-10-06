import type { AgentView } from "@near-intents-agent-api/sdk";

export function ownerDetail(agent: AgentView): string {
  const owner = agent.owner;
  if (!owner) return "no owner signature recorded";
  switch (owner.type) {
    case "near":
      return `near · ${owner.account_id}`;
    case "evm":
      return `evm · ${owner.address} · chain ${owner.chain_id}`;
    case "passkey":
      return `passkey · ${owner.credential_id.slice(0, 24)}… · ${owner.rp_id}`;
  }
}
