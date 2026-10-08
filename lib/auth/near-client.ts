import type { BetterAuthClientPlugin } from "better-auth/client";
import type { siwn } from "better-near-auth";
import { signNearLogin } from "@/lib/near/wallet";

/**
 * Better Auth client plugin for NEAR (SIWN) login.
 *
 * `better-near-auth/client` runs its own wallet connector and disconnects it whenever the
 * session atom holds no data, including while the session is still loading after login. That
 * made the next signing prompt for a wallet again. This plugin keeps the same server contract
 * (`$InferServerPlugin` types `authClient.near.*` from the server's `siwn` plugin) but drives the
 * app's single shared NEAR Connect instance, so login and owner signing use one wallet session.
 */
export const nearLoginClient = () =>
  ({
    id: "near-login",
    $InferServerPlugin: {} as ReturnType<typeof siwn>,
    atomListeners: [{ matcher: (path) => path === "/near/verify", signal: "$sessionSignal" }],
    getActions: ($fetch) => ({
      signIn: {
        /** Connect (or reuse) the wallet, sign the login message and create the session. */
        near: async () =>
          $fetch<{ success: boolean }>("/near/verify", {
            method: "POST",
            body: await signNearLogin(),
          }),
      },
    }),
  }) satisfies BetterAuthClientPlugin;
