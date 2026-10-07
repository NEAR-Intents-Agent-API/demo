import { CHAIN_CATALOGUE } from "./chain-catalogue";

/**
 * Chain identity for the whole demo: one name, one icon, one explorer per chain id.
 *
 * NEAR Intents names chains with short ids (`eth`, `arb`, `sol`). Several spellings appear in
 * the wild (`ethereum`, `arbitrum`), so every lookup goes through `chainInfo`, which folds
 * aliases onto the canonical id and never throws: an unknown chain renders as its own id with no
 * artwork rather than breaking the screen that mentions it.
 */

export type ChainInfo = {
  id: string;
  name: string;
  /** Ticker of the chain's gas token. */
  symbol: string;
  /** Local path under /assets/chains, or an https URL; null when we have no artwork. */
  logo: string | null;
  explorer: string | null;
};

const ALIASES: Record<string, string> = {
  ethereum: "eth",
  arbitrum: "arb",
  polygon: "pol",
  matic: "pol",
  optimism: "op",
  avalanche: "avax",
  bnb: "bsc",
  bnbchain: "bsc",
  solana: "sol",
  bitcoin: "btc",
  dogecoin: "doge",
  litecoin: "ltc",
  toncoin: "ton",
  berachain: "bera",
  xrpledger: "xrp",
  zcash: "zec",
  hyperliquid: "hypercore",
  abstract: "abs",
};

const BY_ID: ReadonlyMap<string, ChainInfo> = new Map(
  CHAIN_CATALOGUE.map((chain) => [
    chain.id,
    {
      id: chain.id,
      name: chain.name,
      symbol: chain.symbol,
      logo: chain.logo,
      explorer: chain.explorer,
    },
  ]),
);

/**
 * Chains worth showing first. NEAR is the home chain, then the routes people actually fund
 * from; everything else follows alphabetically.
 */
const PRIORITY = ["near", "eth", "base", "arb", "sol", "btc", "op", "pol", "bsc", "ton", "tron"];

export function canonicalChainId(id: string): string {
  const key = id.trim().toLowerCase();
  return ALIASES[key] ?? key;
}

export function chainInfo(id: string): ChainInfo {
  const canonical = canonicalChainId(id);
  return (
    BY_ID.get(canonical) ?? {
      id: canonical,
      name: canonical.toUpperCase(),
      symbol: canonical.toUpperCase(),
      logo: null,
      explorer: null,
    }
  );
}

export function compareChains(a: string, b: string): number {
  const rank = (id: string) => {
    const index = PRIORITY.indexOf(canonicalChainId(id));
    return index === -1 ? PRIORITY.length : index;
  };
  return rank(a) - rank(b) || chainInfo(a).name.localeCompare(chainInfo(b).name);
}

/** Every chain we can draw, in display order. */
export function knownChains(): ChainInfo[] {
  return [...BY_ID.values()].sort((a, b) => compareChains(a.id, b.id));
}

/** EVM chain ids used by the omni bridge asset ids, e.g. `nep245:v2_1.omni.hot.tg:10_…`. */
const EVM_CHAIN_IDS: Record<string, string> = {
  "1": "eth",
  "10": "op",
  "56": "bsc",
  "100": "gnosis",
  "137": "pol",
  "8453": "base",
  "42161": "arb",
  "43114": "avax",
  "534352": "scroll",
};

/**
 * Best-effort chain of an asset id, for balances the token list does not describe.
 *
 * Asset ids encode their origin in the name: `nep141:eth-0x….omft.near` lives on Ethereum,
 * `1cs_v1:sol:…` on Solana, `nep141:btc.omft.near` on Bitcoin. Anything native to NEAR (or
 * unrecognised) falls back to `near`, which is where every Intents balance is ultimately held.
 */
export function chainOfAsset(assetId: string): string {
  const oneClick = /^1cs_v1:([a-z0-9]+):/i.exec(assetId);
  if (oneClick?.[1]) return canonicalChainId(oneClick[1]);
  const omni = /^nep245:[^:]+:(\d+)_/.exec(assetId);
  if (omni?.[1] && EVM_CHAIN_IDS[omni[1]]) return EVM_CHAIN_IDS[omni[1]] as string;
  const bridged = /^nep141:([a-z0-9]+)(?:-0x[0-9a-f]+|-[a-z0-9]+)?\.(?:omft|omdep)\.near$/i.exec(
    assetId,
  );
  if (bridged?.[1] && BY_ID.has(canonicalChainId(bridged[1]))) return canonicalChainId(bridged[1]);
  return "near";
}

/**
 * Networks a deposit address can be created on (OutLayer's cross-chain deposit sources), in
 * display order. The source chain is read from the asset id, so only these are offered: an asset
 * from any other chain would be mistaken for a NEAR token.
 */
export const DEPOSIT_CHAINS = [
  "near",
  "eth",
  "base",
  "arb",
  "sol",
  "btc",
  "op",
  "pol",
  "bsc",
  "avax",
  "hood",
  "hypercore",
] as const;
