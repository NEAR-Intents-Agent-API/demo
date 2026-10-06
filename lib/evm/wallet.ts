import { createConfig, createStorage, http, noopStorage } from "wagmi";
import { arbitrum, avalanche, base, bsc, gnosis, mainnet, optimism, polygon } from "wagmi/chains";
import { coinbaseWallet, injected, safe } from "wagmi/connectors";
import { EVM_WALLETS, type EvmProviderLike, isBrandInstalled } from "./wallets";

/** Every legacy provider a page exposes: the nested list when present, otherwise the single one. */
function legacyProviders(window: Window): EvmProviderLike[] {
  const ethereum = (window as { ethereum?: EvmProviderLike }).ethereum;
  if (!ethereum) return [];
  return ethereum.providers?.length ? ethereum.providers : [ethereum];
}

/** The provider this brand claims, searching the nested list so multi-wallet pages work. */
export function legacyProviderFor(window: Window, brandId: string): EvmProviderLike | undefined {
  const brand = EVM_WALLETS.find((candidate) => candidate.id === brandId);
  if (!brand?.detect) return undefined;
  return legacyProviders(window).find((provider) => brand.detect?.(provider, window));
}

/**
 * EVM wallets connect directly to this page, never through a relay.
 *
 * `injected()` (bare) captures the legacy `window.ethereum` fallback and, with EIP-6963
 * discovery, every modern wallet that announces itself. The explicit targets below cover
 * wallets that only expose `window.ethereum` flags — MetaMask, Rainbow, Rabby, Phantom, OKX,
 * Brave, Trust — so the connect modal can offer the full brand list regardless of age.
 * Coinbase Wallet and Safe have their own connectors. `walletConnect()` is deliberately absent:
 * pairing through a relay is not something this dashboard needs.
 *
 * A target whose wallet is absent returns a provider function resolving `undefined`, which
 * keeps the connector inert instead of falling back to whatever `window.ethereum` happens to be.
 */
const legacyTargets = EVM_WALLETS.filter((brand) => brand.detect && !brand.connectorId).map(
  (brand) =>
    injected({
      target: () => ({
        id: brand.id,
        name: brand.name,
        icon: brand.icon,
        provider: () =>
          (typeof window === "undefined"
            ? undefined
            : legacyProviderFor(window, brand.id)) as never,
      }),
    }),
);

export const evmConfig = createConfig({
  chains: [mainnet, arbitrum, base, optimism, polygon, bsc, avalanche, gnosis],
  connectors: [
    injected(),
    coinbaseWallet({ appName: "NEAR Agent Connect", preference: "all" }),
    safe(),
    ...legacyTargets,
  ],
  multiInjectedProviderDiscovery: true,
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
    [optimism.id]: http(),
    [polygon.id]: http(),
    [bsc.id]: http(),
    [avalanche.id]: http(),
    [gnosis.id]: http(),
  },
  storage: createStorage({
    storage: typeof window === "undefined" ? noopStorage : window.localStorage,
  }),
  ssr: true,
});

export type EvmRequest = (input: { method: string; params?: unknown[] }) => Promise<unknown>;

/** The connected provider, checked against the address the owner signed in with. */
export async function connectedEvmRequest(address: string): Promise<EvmRequest> {
  const connection = evmConfig.state.connections.get(evmConfig.state.current ?? "");
  if (!connection?.accounts.some((account) => account.toLowerCase() === address.toLowerCase()))
    throw new Error("evm_account_mismatch");
  const provider = await connection.connector.getProvider();
  if (
    !provider ||
    typeof provider !== "object" ||
    !("request" in provider) ||
    typeof provider.request !== "function"
  )
    throw new Error("evm_wallet_unavailable");
  const request = provider.request.bind(provider) as EvmRequest;
  const accounts = await request({ method: "eth_accounts" });
  if (
    !Array.isArray(accounts) ||
    !accounts.some(
      (value) => typeof value === "string" && value.toLowerCase() === address.toLowerCase(),
    )
  )
    throw new Error("evm_account_mismatch");
  return request;
}

/** Whether the brand can be connected right now; used to choose Connect versus Install. */
export function brandInstalled(brandId: string): boolean {
  return typeof window !== "undefined" && isBrandInstalled(brandId, window);
}

export type { EvmProviderLike };
