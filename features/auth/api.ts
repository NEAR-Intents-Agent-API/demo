import { request } from "@/lib/http/request";

export type NearSignedMessage = {
  accountId: string;
  publicKey: string;
  signature: string;
};

export const authApi = {
  /**
   * Hands the signed NEP-413 login message to the SIWN plugin, which verifies network,
   * recipient, timestamp and replay and then sets the session cookie.
   */
  verifyNear: (input: {
    signedMessage: NearSignedMessage;
    message: string;
    recipient: string;
    nonce: string;
  }) =>
    request<{ success: boolean }>("/api/auth/near/verify", {
      method: "POST",
      body: JSON.stringify({ ...input, accountId: input.signedMessage.accountId }),
    }),
  /** Stores the EVM public key recovered from a SIWE signature; login itself runs through the plugin. */
  storeEvmKey: (input: { message: string; signature: string }) =>
    request<{ stored: boolean }>("/api/auth/evm-key", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
