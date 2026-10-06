const NEUTRAL_ICONS = new Set([
  "guide-imgNearIntentsDemoIconConnections",
  "guide-imgNearIntentsDemoIconNetwork",
  "guide-imgNearIntentsDemoIconSearch",
  "guide-imgNearIntentsDemoIconSun",
  "guide-imgNearIntentsDemoIconUsers",
]);

/** Monochrome exports use theme colors; multicolor illustrations retain their SVG palette. */
export function designAssetIconColor(name: string): string | null {
  if (!name.includes("NearIntentsDemoIcon") && name !== "login-imgNear") return null;
  return NEUTRAL_ICONS.has(name) ? "text-current" : "text-design-accent";
}
