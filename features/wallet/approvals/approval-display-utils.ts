/** Provider vocabulary, made readable without changing its meaning. */
export function humanizeRequestType(requestType: string): string {
  const words = requestType.replaceAll("_", " ").toLowerCase();
  // However the provider spells the request that places an order, the owner is approving an order.
  return words.includes("limit order") ? "limit order" : words;
}
