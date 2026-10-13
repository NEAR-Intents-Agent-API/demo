"use client";

import { useMemo } from "react";
import { chainInfo, knownChains, useCatalog } from "@/features/assets";

export type Network = ReturnType<typeof knownChains>[number];

/** The networks to draw and, once known, how many the catalogue lists. */
export type NetworkSet = { chains: Network[]; count: number | null };

/** Chains we can draw, with no claim about how many networks exist. */
export function fallbackNetworks(): NetworkSet {
  return { chains: knownChains(), count: null };
}

/**
 * The networks the token catalogue lists, with their count. The count stays `null` until the
 * catalogue has answered, so no page claims a number it has not read; the drawn list falls back
 * to the chains we have artwork for in the meantime or if the catalogue cannot be read.
 */
export function useNetworks(): NetworkSet {
  const { chains } = useCatalog();
  return useMemo(
    () =>
      chains.length === 0
        ? fallbackNetworks()
        : { chains: chains.map(chainInfo), count: chains.length },
    [chains],
  );
}
