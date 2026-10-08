import type { NearConnector } from "@hot-labs/near-connect";
import { nearLoginMessage } from "./login";

/**
 * One NEAR Connect instance for the whole app.
 *
 * Login and owner signing must share a connector: two instances attach duplicate global
 * listeners, share wallet storage and race over the selected wallet. This module owns the
 * single instance, the SIWN login ceremony and the account checks signing depends on. It loads
 * lazily, so passkey and EVM sessions never touch it.
 */

export type OwnerConnector = Pick<NearConnector, "getConnectedWallet" | "connect" | "disconnect">;

export type NearWallet = Awaited<ReturnType<NearConnector["connect"]>>;
type ConnectedWallet = { wallet: NearWallet; accounts: Array<{ accountId: string }> };

let connector: Promise<NearConnector> | undefined;

/** The shared connector, created once and reused for login and signing. */
export function nearConnector(): Promise<NearConnector> {
  connector ??= import("@hot-labs/near-connect")
    .then(({ NearConnector }) => new NearConnector({ network: "mainnet" }))
    .catch((error: unknown) => {
      connector = undefined;
      throw error;
    });
  return connector;
}

/**
 * A connected wallet whose active account is exactly `accountId`. If the current selection
 * cannot sign for that owner, the picker is offered once; a wrong pick throws instead of
 * signing for the wrong account.
 */
export async function connectedWallet(
  accountId: string,
  options: { allowConnect: boolean; connector?: Promise<OwnerConnector> } = { allowConnect: true },
): Promise<ConnectedWallet> {
  const instance = await (options.connector ?? nearConnector());
  const connected = await instance.getConnectedWallet().catch(() => null);
  if (connected?.accounts.some((account) => account.accountId === accountId))
    return { wallet: connected.wallet, accounts: connected.accounts };
  if (!options.allowConnect) throw new Error("owner_account_mismatch");
  const wallet = await instance.connect();
  const accounts = await wallet.getAccounts({ network: "mainnet" });
  if (!accounts.some((account) => account.accountId === accountId))
    throw new Error("owner_account_mismatch");
  return { wallet, accounts };
}

/**
 * A 32-byte NEP-413 nonce with the current time in its first 8 bytes. The verifier reads that
 * timestamp, so a nonce generated any other way is rejected as expired.
 */
function loginNonce(): Uint8Array {
  const nonce = new Uint8Array(32);
  new DataView(nonce.buffer).setBigUint64(0, BigInt(Date.now()), false);
  nonce.set(crypto.getRandomValues(new Uint8Array(24)), 8);
  return nonce;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

type SignedLogin = { accountId: string; publicKey: string; signature: string };

/**
 * The SIWN ceremony on the shared connector: reuse the connected wallet when there is one,
 * otherwise connect and sign in a single prompt. The signed message is captured from the
 * connector's `wallet:signInAndSignMessage` event, the only path that returns it. The result is
 * the exact body `/near/verify` expects; the message and recipient name the host.
 */
export async function signNearLogin(): Promise<{
  signedMessage: SignedLogin;
  accountId: string;
  message: string;
  recipient: string;
  nonce: string;
}> {
  const recipient = window.location.host;
  const message = nearLoginMessage(recipient);
  const nonce = loginNonce();
  const input = { message, recipient, nonce };
  const instance = await nearConnector();
  const connected = await instance.getConnectedWallet().catch(() => null);
  let signedMessage: SignedLogin | null = null;
  if (connected?.accounts.length) {
    signedMessage = await connected.wallet.signMessage({ ...input, network: "mainnet" });
  } else {
    const handler = (event: { accounts: Array<{ signedMessage?: SignedLogin }> }) => {
      signedMessage = event.accounts[0]?.signedMessage ?? null;
    };
    instance.on("wallet:signInAndSignMessage", handler);
    try {
      await instance.connect({ signMessageParams: input });
    } finally {
      instance.off("wallet:signInAndSignMessage", handler);
    }
  }
  if (!signedMessage) throw new Error("Wallet sign-in was cancelled or failed");
  return {
    signedMessage,
    accountId: (signedMessage as SignedLogin).accountId,
    message,
    recipient,
    nonce: toHex(nonce),
  };
}

/** Drops the retained wallet selection so the next ceremony starts from a fresh picker. */
export async function disconnectNearWallet(): Promise<void> {
  if (!connector) return;
  try {
    const instance = await connector;
    await instance.disconnect();
  } catch {
    // A failed disconnect only means the next connect opens the picker again.
  }
}
