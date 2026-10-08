"use client";

import { passkeyClient } from "@better-auth/passkey/client";
import { siweClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { nearLoginClient } from "@/lib/auth/near-client";

/**
 * Better Auth browser client for the demo. Every call goes through the demo's own
 * `/api/auth/*` surface, so the browser talks only to the demo origin. Agent API credentials
 * are never part of this client.
 *
 * NEAR, EVM and passkey login all go through it, typed from the server's plugins. NEAR login
 * runs on the app's shared NEAR Connect instance so login and owner signing share one wallet
 * selection (see `lib/auth/near-client.ts` and `lib/near/wallet.ts`).
 *
 * The OAuth provider client plugin is deliberately absent: it would make the auth handler
 * resume an authorization flow inside the sign-in response, which the demo's unified login
 * cannot express. MCP continuations are explicit instead — see `features/auth/oauth-continue.ts`.
 */
export const authClient = createAuthClient({
  // The browser resolves against the current origin. A Node import has no origin to infer and
  // must never reach the network, so it gets a syntactically valid base only.
  ...(typeof window === "undefined" ? { baseURL: "http://localhost:3001" } : {}),
  plugins: [nearLoginClient(), siweClient(), passkeyClient()],
});
