/** Provider vocabulary, made readable without changing its meaning. */
export function humanizeRequestType(requestType: string): string {
  return requestType.replaceAll("_", " ").toLowerCase();
}
