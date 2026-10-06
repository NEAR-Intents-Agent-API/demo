const fallbackMessage = "Authentication failed. Try again.";

const failureMessages: Record<string, string> = {
  auth_session_missing:
    "Sign-in did not create a session. Allow cookies for this site and try again.",
  "User rejected": "Wallet request cancelled. Choose a wallet to try again.",
  "Wallet sign-in was cancelled or failed": "Wallet sign-in did not complete. Try again.",
  passkey_not_registered: "No passkey found on this device. Register one below to continue.",
  passkey_registration_failed: "Passkey registration did not complete. Nothing was changed.",
  passkey_algorithm_unsupported:
    "That authenticator uses an algorithm this app cannot verify. Try a platform passkey or a different device.",
  evm_account_mismatch:
    "Selected wallet account changed. Reconnect the owner wallet and try again.",
  evm_wallet_unavailable: "No EVM wallet detected in this browser.",
  siwe_nonce_invalid: "Sign-in challenge is invalid. Try again.",
  UNAUTHORIZED_INVALID_OR_EXPIRED_NONCE: "Sign-in challenge expired. Try again.",
};

export function authFailureMessage(cause: unknown): string {
  const code = cause instanceof Error ? cause.message : "";
  const message = Object.hasOwn(failureMessages, code) ? failureMessages[code] : undefined;
  return message ?? fallbackMessage;
}
