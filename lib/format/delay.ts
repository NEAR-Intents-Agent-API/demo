/** An execution delay for display. The API reports milliseconds; the editor works in seconds. */
export function formatDelayMs(delayMs: number): string {
  if (delayMs === 0) return "No delay";
  const seconds = delayMs / 1000;
  return `${seconds} ${seconds === 1 ? "second" : "seconds"}`;
}
