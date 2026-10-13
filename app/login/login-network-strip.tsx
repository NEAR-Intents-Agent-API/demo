import { canonicalChainId, chainInfo, compareChains } from "@/features/assets/index";
import { fallbackNetworks, NetworkStrip } from "@/features/home/index";
import { agentApi } from "@/lib/agent-api/client";
import { catalogChains } from "@/lib/agent-api/token-chains";

/**
 * The sign-in page has no session, so the catalogue provider is not mounted: the networks come
 * from the Agent API's public token list on the server, and the static list only stands in when
 * that list cannot be read.
 */
export async function LoginNetworkStrip() {
  const listed = await catalogChains(agentApi());
  const ids = listed ? [...new Set(listed.map(canonicalChainId))].sort(compareChains) : [];
  return (
    <NetworkStrip
      compact
      networks={
        ids.length > 0 ? { chains: ids.map(chainInfo), count: ids.length } : fallbackNetworks()
      }
    />
  );
}
