const fallbackMessage = "Authentication failed. Try again.";
const walletFallbackMessage = "Could not connect to the wallet. Try again.";

const declinedMessage = "Wallet request declined. Choose a wallet to try again.";
const passkeyPromptMessage =
  "The passkey prompt was cancelled or timed out, or this device has no passkey for this site. To create one, choose Register a passkey.";

/** Messages the sign-in code throws or the server returns, matched exactly. */
const failureMessages: Record<string, string> = {
  auth_session_missing:
    "Sign-in did not create a session. Allow cookies for this site and try again.",
  "Wallet sign-in was cancelled or failed": "Wallet sign-in did not complete. Try again.",
  passkey_prompt_closed: passkeyPromptMessage,
  passkey_registration_cancelled: "Passkey registration was cancelled. Nothing was created.",
  passkey_registration_failed: "Passkey registration did not complete. Nothing was created.",
  passkey_algorithm_unsupported:
    "That authenticator uses an algorithm this app cannot verify. Try a platform passkey or a different device.",
  evm_account_mismatch:
    "Selected wallet account changed. Reconnect the owner wallet and try again.",
  evm_wallet_unavailable: "No EVM wallet detected in this browser.",
  siwe_nonce_invalid: "Sign-in challenge is invalid. Try again.",
  UNAUTHORIZED_INVALID_OR_EXPIRED_NONCE: "Sign-in challenge expired. Try again.",
};

/** Wallet-library errors by `name` (viem and wagmi set it on every error class). */
const failureByName: Record<string, string> = {
  UserRejectedRequestError: declinedMessage,
  ConnectorAlreadyConnectedError: "This wallet is already connected. Try signing in again.",
  ConnectorNotFoundError: "No EVM wallet detected in this browser.",
  ProviderNotFoundError: "No EVM wallet detected in this browser.",
  ChainMismatchError:
    "Your wallet is on a different network. Switch network in the wallet and try again.",
  ConnectorChainMismatchError:
    "Your wallet is on a different network. Switch network in the wallet and try again.",
  SwitchChainError:
    "Your wallet could not switch network. Switch network in the wallet and try again.",
  ChainNotConfiguredError:
    "Your wallet is on a network this app does not support. Switch network in the wallet and try again.",
  ResourceUnavailableRpcError:
    "Your wallet already has a request open. Finish or dismiss it in the wallet, then try again.",
};

/** EIP-1193 provider error codes (wallets throw plain objects with these). */
const failureByCode: Record<string, string> = {
  "4001": declinedMessage,
  "4100": "Your wallet has not approved this site. Connect the wallet again and try.",
  "4902": "Your wallet does not know this network. Switch network in the wallet and try again.",
  "-32002":
    "Your wallet already has a request open. Finish or dismiss it in the wallet, then try again.",
  ACTION_REJECTED: declinedMessage,
  PASSKEY_NOT_FOUND:
    "This passkey is not registered with this dashboard. Register a new one to continue.",
  ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED:
    "This device already has a passkey for this site. Choose Sign in with a passkey instead.",
};

/** Wallets that do not set a code word their refusals in a few stable ways. */
const declinedText = /user (rejected|denied|declined|cancell?ed)|request (rejected|declined)/i;

function fieldOf(value: unknown, key: "name" | "code" | "message" | "cause"): unknown {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)[key]
    : undefined;
}

/** The cause chain, outermost first; wallet libraries wrap the provider's own error. */
function causeChain(cause: unknown): unknown[] {
  const chain: unknown[] = [];
  for (let link = cause; link !== undefined && link !== null && chain.length < 5; ) {
    chain.push(link);
    link = fieldOf(link, "cause");
  }
  return chain;
}

function lookup(table: Record<string, string>, key: unknown): string | undefined {
  const text = typeof key === "number" ? String(key) : key;
  return typeof text === "string" && Object.hasOwn(table, text) ? table[text] : undefined;
}

/** Plain-language text for a known failure, matched by message, error name or provider code. */
function classify(cause: unknown): string | undefined {
  for (const link of causeChain(cause)) {
    const known =
      lookup(failureMessages, fieldOf(link, "message")) ??
      lookup(failureByName, fieldOf(link, "name")) ??
      lookup(failureByCode, fieldOf(link, "code"));
    if (known) return known;
  }
  const message = fieldOf(cause, "message");
  return typeof message === "string" && declinedText.test(message) ? declinedMessage : undefined;
}

export function authFailureMessage(cause: unknown): string {
  return classify(cause) ?? fallbackMessage;
}

/** The wallet picker's connect step, before any sign-in message is requested. */
export function walletConnectMessage(cause: unknown): string {
  return classify(cause) ?? walletFallbackMessage;
}
