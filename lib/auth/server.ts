// `@peculiar/x509` (via passkey/owner-auth) uses tsyringe, which needs the
// Reflect metadata API before it is evaluated. Turbopack does not keep the
// dependency's own side-effect import ahead of tsyringe, so load it here.
import "reflect-metadata";
import { cimd } from "@better-auth/cimd";
import { fetchClientMetadataResource } from "@better-auth/cimd/node";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { mcp } from "@better-auth/mcp";
import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { jwt, siwe } from "better-auth/plugins";
import { siwn } from "better-near-auth";
import { eq } from "drizzle-orm";
import { hashMessage, recoverMessageAddress, recoverPublicKey } from "viem";
import { authAuthority, authOrigin, passkeyRpId } from "@/lib/auth/authority";
import { createChallengeStore } from "@/lib/auth/challenges";
import { coseAlgorithmFromRegistration } from "@/lib/auth/passkey-metadata";
import { resolvePasskeyRegistration } from "@/lib/auth/passkey-registration";
import type { DemoEnv } from "@/lib/config/env";
import type { DemoDatabase } from "@/lib/db/client";
import { schema, walletAddress } from "@/lib/db/schema";
import { MCP_SCOPES } from "@/lib/mcp/config";
import { mcpAccessClaims, oauthConsentReference } from "@/lib/mcp/oauth";
import { nearLoginMessage } from "@/lib/near/login";

export type DemoAuth = ReturnType<typeof createDemoAuth>;

/**
 * One Better Auth instance owns every demo identity provider: NEAR (SIWN), EVM (SIWE),
 * passkeys. Agent binding and policy consent are separate ceremonies and
 * never reuse these login signatures.
 *
 * It is also the MCP authorization server: `mcp()` is the OAuth 2.1 provider bound to the
 * per-agent resource base, `cimd()` identifies harnesses from their hosted metadata
 * document, and `jwt()` signs the access tokens resource servers verify. Every agent gets
 * its own resource identifier, so one token reaches exactly one agent.
 *
 * `authAuthority(config)` (host[:port]) is the single agreed authority for the SIWE domain,
 * the SIWN NEP-413 recipient, so every issued message verifies.
 */
export function createDemoAuth(database: DemoDatabase, config: DemoEnv) {
  const authority = authAuthority(config);
  const origin = authOrigin(config);
  const secureCookies = new URL(config.BETTER_AUTH_URL).protocol === "https:";
  const challenges = createChallengeStore(database);

  return betterAuth({
    appName: "NEAR Agent Connect",
    baseURL: config.BETTER_AUTH_URL,
    secret: config.BETTER_AUTH_SECRET,
    trustedOrigins: [origin],
    database: drizzleAdapter(database.db, { provider: "pg", schema, transaction: true }),
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60,
    },
    advanced: {
      ipAddress: { ipAddressHeaders: ["x-real-ip"] },
      useSecureCookies: secureCookies,
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        secure: secureCookies,
        path: "/",
      },
    },
    rateLimit: { enabled: true, storage: "database", window: 60, max: 60 },
    hooks: {
      // The SIWN plugin verifies the signature over whatever recipient and message the browser
      // sends, so a login signed for another site would otherwise create a session here.
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== "/near/verify") return;
        const { recipient, message } = (ctx.body ?? {}) as { recipient?: string; message?: string };
        if (recipient !== authority || message !== nearLoginMessage(authority))
          throw APIError.from("UNAUTHORIZED", {
            code: "NEAR_LOGIN_MISMATCH",
            message: "near_login_mismatch",
          });
      }),
      // Owner proofs need the wallet's public key, which a SIWE login is the only place to
      // recover (from the signature over the exact message the owner just signed).
      after: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== "/siwe/verify" || !ctx.context.newSession) return;
        const { message, signature } = ctx.body as { message: string; signature: `0x${string}` };
        const recovered = await recoverPublicKey({ hash: hashMessage(message), signature });
        const address = await recoverMessageAddress({ message, signature });
        await database.db
          .update(walletAddress)
          .set({ publicKey: `0x${recovered.slice(4)}` })
          .where(eq(walletAddress.address, address));
      }),
    },
    plugins: [
      jwt(),
      siwn({
        // better-near-auth requires both keys; the demo only ever issues mainnet challenges.
        recipients: {
          mainnet: authority,
          testnet: authority,
        },
      }),
      siwe({
        domain: authority,
        anonymous: true,
        getNonce: async () => challenges.issue(),
        // Recover independently of the parsed message so a mismatched address fails closed.
        verifyMessage: async ({ message, signature, address, chainId }) =>
          Number.isSafeInteger(chainId) &&
          chainId > 0 &&
          (
            await recoverMessageAddress({ message, signature: signature as `0x${string}` })
          ).toLowerCase() === address.toLowerCase(),
      }),
      passkey({
        rpName: config.PASSKEY_RP_NAME ?? "NEAR Agent Connect",
        rpID: passkeyRpId(config),
        origin,
        authenticatorSelection: { residentKey: "required", userVerification: "required" },
        registration: {
          // A visitor with no passkey yet has no session either, so passkey-first
          // registration must be allowed. With a session, the plugin attaches the new
          // credential to the signed-in demo user instead of creating another one.
          requireSession: false,
          resolveUser: () => resolvePasskeyRegistration({ database }),
          // ES256 is the only algorithm `OwnerWallet` accepts. The algorithm lives in the COSE
          // key inside `attestationObject`, so the plugin's own verification result is the
          // place to read it; storing any other credential would lock the owner out later.
          afterVerification: ({ clientData }) => {
            const algorithm = coseAlgorithmFromRegistration(
              clientData as unknown as Record<string, unknown>,
            );
            if (algorithm !== -7)
              throw APIError.from("BAD_REQUEST", {
                code: "PASSKEY_ALGORITHM_UNSUPPORTED",
                message: "passkey_algorithm_unsupported",
              });
          },
        },
        authentication: {
          // The Agent API rejects an assertion that is not user-verified. The plugin verifies
          // with `requireUserVerification: false`, so enforce the flag it reports.
          afterVerification: ({ verification }) => {
            if (!verification.authenticationInfo.userVerified)
              throw APIError.from("UNAUTHORIZED", {
                code: "PASSKEY_USER_VERIFICATION_REQUIRED",
                message: "passkey_user_verification_required",
              });
          },
        },
      }),
      mcp({
        loginPage: "/login",
        consentPage: "/consent",
        // The per-agent resource is registered during onboarding; this base keeps the
        // provider's own resource row and default-client link valid.
        resource: `${config.MCP_ORIGIN}/api/agents`,
        scopes: [...MCP_SCOPES],
        // Agents are authorized by the owner's consent to one resource, not by an
        // operator-maintained client↔resource table. Audience binding at the MCP route
        // plus the consent check is the gate.
        enforcePerClientResources: false,
        postLogin: {
          page: "/consent",
          shouldRedirect: async () => false,
          consentReferenceId: ({ user }) => oauthConsentReference(user.id, database),
        },
        extensions: [mcpAccessClaims(database)],
        allowPublicClientPrelogin: true,
        allowDynamicClientRegistration: true,
        allowUnauthenticatedClientRegistration: true,
        // Short-lived access tokens; the harness renews with its refresh token.
        accessTokenExpiresIn: 15 * 60,
        refreshTokenExpiresIn: 30 * 24 * 60 * 60,
        // Harnesses retry a refresh after a lost response; MCP defaults this to 30s.
        refreshTokenReuseInterval: 30,
      }),
      cimd({
        fetchClientMetadataResource,
        metadataProfile: "mcp-2026-07-28",
      }),
    ],
  });
}
