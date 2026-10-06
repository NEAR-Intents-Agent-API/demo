import { canonicalChainId, chainInfo } from "./chains";

export function foldedChains(chains: readonly string[], limit: number, selected: string | null) {
  const head = chains.slice(0, limit);
  return selected && !head.includes(selected) ? [...head.slice(0, limit - 1), selected] : head;
}

/** Filter only supplied routes, preserving their original IDs and order. */
export function filterNetworks(chains: readonly string[], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...chains];
  return chains.filter((id) => {
    const info = chainInfo(id);
    return (
      [id, info.name, info.symbol].some((value) => value.toLowerCase().includes(needle)) ||
      canonicalChainId(needle) === info.id
    );
  });
}
