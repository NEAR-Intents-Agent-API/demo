import { knownChains } from "@/features/assets/index";

export type Network = ReturnType<typeof knownChains>[number];

/** The networks to draw and, once known, how many the catalogue lists. */
export type NetworkSet = { chains: Network[]; count: number | null };

/** Chains we can draw, with no claim about how many networks exist. Safe on the server. */
export function fallbackNetworks(): NetworkSet {
  return { chains: knownChains(), count: null };
}
