import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { makeSignature } from "better-auth/crypto";
import { createDemoAuth } from "../../lib/auth/server";
import { demoConfig, parseDemoEnv } from "../../lib/config/env";
import { configureDemoRuntime } from "../../lib/config/runtime";
import { user } from "../../lib/db/schema";
import { createDemoTestDatabase } from "../../lib/db/testing";
import { forwardOAuthConsent, validateOAuthQuery } from "../../lib/mcp/oauth";
import { ensureAgentResource } from "../../lib/mcp/resources";

test("OAuth bridge validates signed requests and forwards consent behind a TLS proxy", async () => {
  const origin = "https://demo.example.test";
  const config = demoConfig(
    parseDemoEnv({
      NEAR_INTENTS_AGENT_API_URL: "https://api.example.test",
      NEAR_INTENTS_AGENT_API_KEY: "naa_example_key",
      BETTER_AUTH_SECRET: "test-only-demo-auth-secret-32-chars",
      SECRET_ENCRYPTION_KEY: "test-only-demo-encryption-key-32-chars",
    }),
    origin,
  );
  configureDemoRuntime(config);
  const database = await createDemoTestDatabase();
  const auth = createDemoAuth(database, config);
  const state = globalThis as unknown as {
    demoDatabase?: typeof database;
    demoAuth?: { origin: string; auth: typeof auth };
  };
  const previous = { database: state.demoDatabase, auth: state.demoAuth };
  state.demoDatabase = database;
  state.demoAuth = { origin, auth };
  try {
    const agentId = "a".repeat(64);
    await ensureAgentResource(agentId, database);
    const registered = await auth.handler(
      new Request(`${origin}/api/auth/oauth2/register`, {
        method: "POST",
        headers: { "content-type": "application/json", origin },
        body: JSON.stringify({
          client_name: "Codex",
          application_type: "native",
          redirect_uris: ["http://127.0.0.1:56799/callback"],
          token_endpoint_auth_method: "none",
          grant_types: ["authorization_code", "refresh_token"],
          response_types: ["code"],
          scope: "agent:full offline_access",
        }),
      }),
    );
    assert.equal(registered.status, 201, await registered.clone().text());
    const client = (await registered.json()) as { client_id: string };
    const query = new URLSearchParams({
      client_id: client.client_id,
      response_type: "code",
      redirect_uri: "http://127.0.0.1:56799/callback",
      scope: "agent:full offline_access",
      resource: `${origin}/api/agents/${agentId}/mcp`,
      code_challenge: createHash("sha256").update("test-verifier").digest("base64url"),
      code_challenge_method: "S256",
      state: "test-state",
    });
    const started = await auth.handler(
      new Request(`${origin}/api/auth/oauth2/authorize?${query}`, {
        headers: { accept: "text/html", "sec-fetch-mode": "navigate" },
      }),
    );
    assert.equal(started.status, 302);
    const signed = new URL(started.headers.get("location") as string, origin).searchParams;
    assert.ok(signed.has("sig"));
    await database.db.insert(user).values({
      id: "owner",
      name: "Owner",
      email: "owner@test.invalid",
    });
    const context = await auth.$context;
    const session = await context.internalAdapter.createSession("owner");
    const cookie = `${context.authCookies.sessionToken.name}=${session.token}.${await makeSignature(session.token, context.secret)}`;
    // Next.js exposes its bind address in request.url while proxy headers carry public identity.
    const request = new Request(`https://0.0.0.0:8080/api/agents/${agentId}/mcp/challenge`, {
      method: "POST",
      headers: { cookie, origin, "x-forwarded-host": "demo.example.test" },
    });
    assert.deepEqual(await validateOAuthQuery(request, signed.toString(), agentId), {
      clientId: client.client_id,
      name: "Codex",
    });
    const tampered = new URLSearchParams(signed);
    tampered.set("state", "changed");
    await assert.rejects(validateOAuthQuery(request, tampered.toString(), agentId), {
      message: "oauth_query_invalid",
    });
    const redirect = new URL(await forwardOAuthConsent(request, signed.toString(), false));
    assert.equal(redirect.origin, "http://127.0.0.1:56799");
    assert.equal(redirect.pathname, "/callback");
    assert.equal(redirect.searchParams.get("error"), "access_denied");
    assert.equal(redirect.searchParams.get("state"), "test-state");
  } finally {
    state.demoDatabase = previous.database;
    state.demoAuth = previous.auth;
    configureDemoRuntime();
    await database.close();
  }
});
