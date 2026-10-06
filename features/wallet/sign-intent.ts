"use client";

import type { GenerateIntentResponse, SignedData } from "@near-intents-agent-api/sdk";
import { startAuthentication } from "@simplewebauthn/browser";
import { getAccount, signTypedData } from "wagmi/actions";
import { signedDataSchema } from "@/lib/agent-api/schemas";
import { evmConfig } from "@/lib/evm/wallet";
import { connectedWallet, nearConnector, type OwnerConnector } from "@/lib/near/wallet";
import { signNearIntent } from "./sign-near-intent";

let signing = false;

/**
 * One owner signature per prepared intent. Wallets sign the server payload unchanged; encoding
 * normalization belongs to the API.
 *
 * A single non-reactive flag serializes ceremonies because a wallet can only show one prompt at
 * a time. It is released in `finally`, so a rejected or failed prompt never bricks the next one.
 */
export async function signIntent(
  request: Pick<GenerateIntentResponse, "intent" | "signer">,
  connector: () => Promise<OwnerConnector> = nearConnector,
): Promise<SignedData> {
  if (signing) throw new Error("wallet_request_pending");
  signing = true;
  try {
    return await signWithWallet(request, connector);
  } finally {
    signing = false;
  }
}

async function signWithWallet(
  { intent, signer }: Pick<GenerateIntentResponse, "intent" | "signer">,
  connector: () => Promise<OwnerConnector>,
): Promise<SignedData> {
  switch (intent.standard) {
    case "eip712": {
      if (signer.type !== "evm") throw new Error("owner_challenge_mismatch");
      const account = getAccount(evmConfig).address;
      if (account?.toLowerCase() !== signer.address.toLowerCase())
        throw new Error("evm_account_mismatch");
      const signature = await signTypedData(evmConfig, { ...intent.payload, account });
      return { ...intent, signature };
    }
    case "webauthn":
      return signedDataSchema.parse({
        ...intent,
        credential: await startAuthentication({ optionsJSON: intent.payload }),
      });
    case "nep413":
    case "nep366": {
      if (signer.type !== "near") throw new Error("owner_challenge_mismatch");
      const { wallet } = await connectedWallet(signer.account_id, {
        allowConnect: true,
        connector: connector(),
      });
      return signNearIntent(intent, signer.account_id, wallet);
    }
  }
}
