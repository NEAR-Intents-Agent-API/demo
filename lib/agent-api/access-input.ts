/**
 * What an owner may ask for when issuing access: a label and an expiry. Checked in the form
 * before anything is signed and again on the server. The label is part of the signed message, so
 * it stays printable ASCII (a non-ASCII character once broke wallet signatures).
 */

export const GRANT_LABEL_MAX = 64;
export const GRANT_MAX_DAYS = 365;
/** Signing takes a moment; shorter access would end before it begins. */
export const GRANT_MIN_MINUTES = 5;

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

export function grantLabelProblem(label: string): string | null {
  const trimmed = label.trim();
  if (!trimmed) return "Name this access so you can recognise it later";
  if (trimmed.length > GRANT_LABEL_MAX)
    return `Use at most ${GRANT_LABEL_MAX} characters (this is ${trimmed.length})`;
  if (!/^[\x20-\x7e]+$/.test(trimmed))
    return "Use plain letters, numbers and punctuation only; the name is signed in your wallet";
  return null;
}

/** `expiresAtMs` is NaN when the owner has not picked a date. */
export function grantExpiryProblem(expiresAtMs: number, now: number): string | null {
  if (!Number.isFinite(expiresAtMs)) return "Choose an expiry date and time";
  if (expiresAtMs <= now) return "The expiry is in the past; choose a future date and time";
  if (expiresAtMs < now + GRANT_MIN_MINUTES * MINUTE_MS)
    return `Access must last at least ${GRANT_MIN_MINUTES} minutes`;
  if (expiresAtMs > now + GRANT_MAX_DAYS * DAY_MS)
    return `Access can last at most ${GRANT_MAX_DAYS} days`;
  return null;
}
