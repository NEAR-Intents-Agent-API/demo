import type { NearConnector } from "@hot-labs/near-connect";
import type { GenerateIntentResponse, SignedData } from "@near-intents-agent-api/sdk";

type NearIntent = Extract<GenerateIntentResponse["intent"], { standard: "nep413" | "nep366" }>;
type NearWallet = Awaited<ReturnType<NearConnector["connect"]>>;

/** The live wallet owns connection state; the server intent owns signer identity. */
export async function signNearIntent(
  intent: NearIntent,
  accountId: string,
  wallet: NearWallet,
): Promise<SignedData> {
  // Only connection discovery is recoverable. Never replay a signing request automatically.
  if (intent.standard === "nep413") {
    const signed = await wallet.signMessage({
      ...intent.payload,
      nonce: Uint8Array.from(atob(intent.payload.nonce), (char) => char.charCodeAt(0)),
      signerId: accountId,
      network: "mainnet",
    });
    if (signed.accountId !== accountId) throw new Error("owner_account_mismatch");
    if (!signed.publicKey || !signed.signature) throw new Error("wallet_signature_missing");
    return { ...intent, public_key: signed.publicKey, signature: signed.signature };
  }
  const signed = await wallet.signDelegateActions({
    delegateActions: [intent.payload],
    signerId: accountId,
    network: "mainnet",
  });
  const signedDelegate = signed.signedDelegateActions[0];
  if (!signedDelegate) throw new Error("wallet_signature_missing");
  return { ...intent, signed_delegate: signedDelegate };
}
