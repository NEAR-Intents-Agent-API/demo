const cancelledNames = new Set(["UserRejectedRequestError", "NotAllowedError", "AbortError"]);
// EIP-1193 user rejection, ethers' ACTION_REJECTED, and SimpleWebAuthn's aborted ceremony.
const cancelledCodes = new Set([4001, "ACTION_REJECTED", "ERROR_CEREMONY_ABORTED"]);
const cancelledText = [
  /\buser (rejected|denied|declined|cancell?ed|closed)/i,
  /\b(request|transaction|signature|signing) (was )?(rejected|denied|declined|cancell?ed)/i,
  /\bnot allowed by the user/i,
];

/**
 * True when a wallet or passkey prompt ended because the person dismissed it. NEAR wallets,
 * wagmi/viem and WebAuthn each report this differently, so name, code and message are all
 * checked along the `cause` chain rather than matching one exact string.
 */
export function isWalletCancellation(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && typeof current === "object" && current !== null; depth += 1) {
    const { name, code, message, cause } = current as Record<string, unknown>;
    if (typeof name === "string" && cancelledNames.has(name)) return true;
    if ((typeof code === "number" || typeof code === "string") && cancelledCodes.has(code))
      return true;
    if (typeof message === "string" && cancelledText.some((pattern) => pattern.test(message)))
      return true;
    current = cause;
  }
  return false;
}
