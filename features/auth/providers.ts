import { createSiweMessage } from "viem/siwe";
import { authClient } from "@/lib/auth/client";
import type { EvmRequest } from "@/lib/evm/wallet";
/**
 * NEAR login (SIWN). The app's single NEAR Connect instance performs connect → sign the exact
 * NEP-413 message; the server checks its recipient and message, then the plugin verifies
 * network, timestamp and replay before it creates the session. Owner signing later reuses the
 * same instance and wallet selection.
 */
export async function nearLogin(): Promise<void> {
  unwrap(await authClient.signIn.near());
}

/**
 * EVM login through Better Auth's SIWE plugin. The plugin issues the nonce and verifies the
 * ERC-4361 message (domain, chain, single use) before it creates the session; the server then
 * records the recovered public key for owner proofs.
 */
export async function evmLogin(address: string, ethereumRequest: EvmRequest): Promise<void> {
  const { nonce } = unwrap(await authClient.siwe.nonce());
  if (typeof nonce !== "string" || !/^[A-Za-z0-9]{8,}$/.test(nonce))
    throw new Error("siwe_nonce_invalid");
  const accounts = await ethereumRequest({ method: "eth_accounts" });
  const signer = Array.isArray(accounts) ? String(accounts[0] ?? "") : "";
  if (!signer || signer.toLowerCase() !== address.toLowerCase())
    throw new Error("evm_account_mismatch");
  const chainId = Number.parseInt(String(await ethereumRequest({ method: "eth_chainId" })), 16);
  if (!Number.isInteger(chainId) || chainId <= 0) throw new Error("evm_chain_unavailable");
  // The plugin compares `domain` as host[:port], and the signature covers this exact string.
  const message = createSiweMessage({
    address: signer as `0x${string}`,
    chainId,
    domain: window.location.host,
    uri: window.location.origin,
    nonce,
    version: "1",
    statement: "Sign in to NEAR Agent Connect. This does not authorize any transfer.",
  });
  const signature = String(
    await ethereumRequest({
      method: "personal_sign",
      params: [
        `0x${Array.from(new TextEncoder().encode(message), (byte) => byte.toString(16).padStart(2, "0")).join("")}`,
        signer,
      ],
    }),
  );
  unwrap(await authClient.siwe.verify({ message, signature }));
}

/**
 * Passkey login. Options and verification both run inside Better Auth's passkey plugin, which
 * enforces the exact origin, RP ID and counter advancement.
 *
 * Browsers answer a cancelled prompt, a timeout and "no passkey for this site on this device"
 * with the same `NotAllowedError`, so those three cannot be told apart and share one message
 * that names every possibility. A server-side "unknown passkey" is the one definite case.
 */
export async function passkeyLogin(): Promise<void> {
  try {
    unwrap(await authClient.signIn.passkey());
  } catch (cause) {
    if (isPromptClosed(cause)) throw new Error("passkey_prompt_closed");
    throw cause;
  }
}

/**
 * Passkey registration through Better Auth's own client action, which also creates the
 * session. The server verifies the attestation and persists only public credential metadata
 * and the signature counter; the private key never leaves the authenticator. The owner row is
 * created together with the credential, so a cancelled prompt leaves nothing behind.
 */
export async function passkeyRegister(name: string): Promise<void> {
  try {
    unwrap(await authClient.passkey.addPasskey({ name, createSession: true }));
  } catch (cause) {
    if (isPromptClosed(cause)) throw new Error("passkey_registration_cancelled");
    throw cause;
  }
}

/** WebAuthn codes the passkey client reports when the prompt did not produce a credential. */
const PROMPT_CLOSED_CODES = new Set([
  "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
  "ERROR_CEREMONY_ABORTED",
  "AUTH_CANCELLED",
]);

function isPromptClosed(cause: unknown): boolean {
  if (cause instanceof AuthRequestError) return PROMPT_CLOSED_CODES.has(cause.code ?? "");
  return (
    cause instanceof Error && (cause.name === "NotAllowedError" || cause.name === "AbortError")
  );
}

/** A Better Auth client failure; `code` is the server's error code or the WebAuthn error code. */
export class AuthRequestError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = "AuthRequestError";
  }
}

/** Better Auth client results are `{ data, error }`; errors become thrown values here. */
function unwrap<T>(result: {
  data?: T | null;
  error?: { message?: string | null; code?: string | null } | null;
}): T {
  if (result.error)
    throw new AuthRequestError(
      result.error.message ?? "auth_request_failed",
      result.error.code ?? undefined,
    );
  if (result.data === undefined || result.data === null) throw new Error("auth_request_failed");
  return result.data;
}
