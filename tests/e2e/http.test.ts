import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { mkdtemp, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import type {
  GenerateIntentResponse,
  Intent,
  PolicyView,
  SignedData,
} from "@near-intents-agent-api/sdk";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { eq } from "drizzle-orm";
import { pendingAuthorizationUrl } from "../../features/auth/utils";
import { createDemoDatabase } from "../../lib/db/client";
import { challenge as challengeTable, mcpClientAccess, oauthClient } from "../../lib/db/schema";
import { createDemoHttpDatabase } from "../support/demo-http-database.js";
import { evmIntentSigner } from "../support/intent-signers.js";
import { syntheticPasskey } from "../support/passkey-registration-fixture.js";

const port = 3101;
const origin = `http://localhost:${port}`;
const app = fileURLToPath(new URL("../../", import.meta.url));
/**
 * These are the only tests that exercise the built demo server as a browser would. Cookie
 * flags, logout invalidation, cross-user agent scoping, the passkey counter and the API-key
 * boundary are all properties of real HTTP responses, so they cannot be proven by units.
 *
 * The suite shares one build and one server: Next.js owns a single `.next` directory, so
 * starting two servers concurrently would conflict.
 */
test("demo HTTP suite", { concurrency: 1 }, async (t) => {
  const database = await createDemoHttpDatabase();
  t.after(() => database.close());
  const agentApi = await startStubAgentApi();
  t.after(() => agentApi.close());
  const directory = await mkdtemp(join(tmpdir(), "demo-http-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  for (const name of [".next", "node_modules", "drizzle", "public"])
    await symlink(join(app, name), join(directory, name));
  let server = await startDemoServer(agentApi.url, directory, database.url);
  const stop = async () => {
    if (server.exitCode !== null || server.signalCode !== null) return;
    const exited = new Promise((resolve) => server.once("exit", resolve));
    server.kill("SIGTERM");
    await exited;
  };
  try {
    await t.test("EVM session scopes agents and is invalidated on sign-out", async () => {
      await evmSessionFlow();
    });
    await t.test("passkey registers, persists, signs out and signs back in", async () => {
      await passkeyFlow(async () => {
        await stop();
        server = await startDemoServer(agentApi.url, directory, database.url);
      });
    });
    await t.test("NEAR verify rejects unsigned claims and evm-key needs a session", async () => {
      await authBoundaryFlow();
    });
    await t.test("provider reads surface intents lists and structured errors", async () => {
      await providerReadFlow(agentApi);
    });
    await t.test("deposits need a session but no dashboard grant", async () => {
      await depositFlow(agentApi);
    });
    await t.test(
      "agent-owned MCP isolates keys, OAuth clients and revoked generations",
      async () => {
        await mcpFlow(agentApi, database.url);
      },
    );
  } finally {
    await stop();
  }
});

/**
 * The demo's own auth routes must fail closed. A NEAR login claim without a real wallet
 * signature cannot mint a session through the plugin, and the EVM key capture refuses an
 * anonymous caller before it touches a wallet row.
 */
async function authBoundaryFlow(): Promise<void> {
  const near = await fetch(`${origin}/api/auth/near/verify`, {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({
      signedMessage: {
        accountId: "attacker.near",
        publicKey: `ed25519:${"1".repeat(32)}`,
        signature: "forged",
      },
      message: "Sign in to localhost:3101",
      recipient: "localhost:3101",
      nonce: "00".repeat(32),
      accountId: "attacker.near",
    }),
  });
  assert.notEqual(near.status, 200, await near.clone().text());

  const key = await fetch(`${origin}/api/auth/evm-key`, {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ message: "x", signature: "0x00" }),
  });
  assert.equal(key.status, 401, "no session, no key write");
}

async function depositFlow(stub: Awaited<ReturnType<typeof startStubAgentApi>>) {
  const login = await evmLogin();
  stub.setOwner(login.userId);
  const path = `/api/agents/${stub.ownerAgentId}/funds`;
  const args = {
    source_asset: "nep141:btc.omft.near",
    amount: "100",
    idempotencyKey: "demo-deposit",
  };
  const body = { tool: "create_cross_chain_deposit", args };
  assert.equal((await browserPost(path, body, "")).status, 401);
  assert.equal(
    (await browserPost(`/api/agents/${"b".repeat(64)}/funds`, body, login.cookie)).status,
    404,
  );
  const access = await getJson<{ access: unknown }>(`/api/agents/${stub.ownerAgentId}/access`, {
    cookie: login.cookie,
  });
  assert.equal(access.access, null);
  const before = stub.submissions();
  for (const confidential of [false, true]) {
    const response = await browserPost(
      path,
      { ...body, args: { ...args, confidential, idempotencyKey: `demo-deposit-${confidential}` } },
      login.cookie,
    );
    assert.equal(response.status, 200, await response.clone().text());
    const result = await response.json();
    assert.equal(result.status, "PENDING_DEPOSIT");
    assert.ok(result.operationId);
    const tracked = await getJson<{ status: string }>(
      `/api/agents/${stub.ownerAgentId}/operations/${result.operationId}`,
      { cookie: login.cookie },
    );
    assert.equal(tracked.status, "PENDING_DEPOSIT");
  }
  assert.equal(stub.submissions(), before, "no owner grant submitted");
  const spend = await browserPost(
    path,
    {
      tool: "shield",
      args: { token: "nep141:wrap.near", amount: "100", idempotencyKey: "demo-shield" },
    },
    login.cookie,
  );
  assert.equal(spend.status, 409);
  assert.equal((await spend.json()).error.code, "access_required");
}

async function evmSessionFlow(): Promise<void> {
  const owner = evmOwner();
  const challenge = await getJson<{ nonce: string }>("/api/auth/siwe/nonce", {
    method: "POST",
    body: {},
  });
  assert.match(challenge.nonce, /^[a-z0-9]+$/);

  const message = siweMessage({
    origin,
    nonce: challenge.nonce,
    address: owner.address,
    chainId: 1,
  });
  const signature = owner.sign(message);
  const verify = await fetch(`${origin}/api/auth/siwe/verify`, {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ message, signature }),
  });
  assert.equal(verify.status, 200, await verify.clone().text());
  const cookies = verify.headers.getSetCookie();
  const sessionCookie = cookies.find((cookie) => cookie.startsWith("better-auth.session_token"));
  assert.ok(sessionCookie, "session cookie issued");
  assert.match(sessionCookie, /HttpOnly/i);
  assert.match(sessionCookie, /SameSite=Lax/i);
  const cookieHeader = cookies.map((cookie) => cookie.split(";")[0]).join("; ");

  // The plugin owns login; the key capture is the demo's own follow-up and needs the session.
  const key = await fetch(`${origin}/api/auth/evm-key`, {
    method: "POST",
    headers: { "content-type": "application/json", origin, cookie: cookieHeader },
    body: JSON.stringify({ message, signature }),
  });
  assert.equal(key.status, 200, await key.clone().text());

  const sessionBody = await getJson<{
    session: { userId: string; owner: { type: string; public_key: string } };
  }>("/api/auth/session", { cookie: cookieHeader });
  assert.equal(sessionBody.session.owner.type, "evm");
  assert.equal(
    sessionBody.session.owner.public_key,
    owner.publicKey,
    "API expects the 64-byte key without the SEC1 prefix",
  );
  assert.equal(JSON.stringify(sessionBody).includes("naa_"), false, "no API key in session");

  // The stub tenant holds two users' agents; the BFF must return only this user's and must
  // filter in-process even though the API key could see both.
  const agents = await getJson<{ agents: Array<{ external_user_id: string }> }>("/api/agents", {
    cookie: cookieHeader,
  });
  assert.ok(agents.agents.length > 0, "own agents are listed");
  assert.equal(
    agents.agents.every((agent) => agent.external_user_id === sessionBody.session.userId),
    true,
    "no other user's agents are listed",
  );
  assert.equal(JSON.stringify(agents).includes("naa_"), false, "no API key in agent list");

  // The other user's agent is not readable through the detail route either.
  const foreign = await fetch(`${origin}/api/agents/${"e".repeat(64)}`, {
    headers: { cookie: cookieHeader },
  });
  assert.equal(foreign.status, 404, "another user's agent is not found");

  const replay = await fetch(`${origin}/api/auth/siwe/verify`, {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ message, signature }),
  });
  assert.equal(replay.status, 401, "nonce is single-use");

  const signOut = await fetch(`${origin}/api/auth/sign-out`, {
    method: "POST",
    headers: { "content-type": "application/json", origin, cookie: cookieHeader },
    body: "{}",
  });
  assert.equal(signOut.status, 200);
  const after = await getJson<{ session: unknown }>("/api/auth/session", { cookie: cookieHeader });
  assert.equal(after.session, null, "captured cookie is invalid after sign-out");
}

/**
 * Provider reads through the BFF: the intents list must reach the provider without a token,
 * a tokenless intents single read must preserve the provider's refusal code (rather than
 * surfacing an opaque 500), and pending approvals must render as an empty list.
 */
async function providerReadFlow(
  stub: Awaited<ReturnType<typeof startStubAgentApi>>,
): Promise<void> {
  const login = await evmLogin();
  // The ownership guard compares the agent's externalUserId with this session's user id.
  stub.setOwner(login.userId);
  const agentId = stub.ownerAgentId;

  const list = await getJson<{ source: string; balances: Array<{ balance: string }> }>(
    `/api/agents/${agentId}/balances?source=public`,
    { cookie: login.cookie },
  );
  assert.equal(list.source, "public");
  assert.deepEqual(list.balances, [
    { asset: "nep141:wrap.near", balance: "42", symbol: "wNEAR", decimals: 24 },
  ]);

  const invalid = await fetch(`${origin}/api/agents/${agentId}/balances?source=unknown`, {
    headers: { cookie: login.cookie },
  });
  assert.equal(invalid.status, 400);
  assert.deepEqual(await invalid.json(), { error: { code: "invalid_request" } });

  const approvals = await getJson<{ data: unknown[] }>(`/api/agents/${agentId}/approvals`, {
    cookie: login.cookie,
  });
  assert.deepEqual(approvals.data, []);

  const policy = await getJson<PolicyView>(`/api/agents/${agentId}/policy`, {
    cookie: login.cookie,
  });
  assert.equal(policy.revision, null);
  assert.equal(policy.usage.budget.daily.spent_usd, "0.000000");
  assert.deepEqual(policy.usage.timelock, { delay_ms: 0, scheduled_count: 0 });
  for (const resource of ["budget", "timelock", "limits"]) {
    const response = await fetch(`${origin}/api/agents/${agentId}/${resource}`, {
      headers: { cookie: login.cookie },
    });
    assert.equal(response.status, 404);
  }

  const denied = await fetch(`${origin}/api/agents/${"f".repeat(64)}/balances?source=public`, {
    headers: { cookie: login.cookie },
  });
  assert.equal(denied.status, 404);
}

/** Real HTTP exercises the same account endpoint with separately signed client grants. */
async function mcpFlow(
  stub: Awaited<ReturnType<typeof startStubAgentApi>>,
  databaseUrl: string,
): Promise<void> {
  const login = await evmLogin();
  stub.setOwner(login.userId);
  const agentId = stub.ownerAgentId;
  const path = `/api/agents/${agentId}/mcp`;
  const outsider = await evmLogin();
  assert.equal(
    (await browserPost(`${path}/challenge`, { name: "foreign owner" }, outsider.cookie)).status,
    404,
  );
  const page = await getJson<{ endpoint: string; clients: unknown[] }>(path, {
    cookie: login.cookie,
  });
  assert.equal(page.endpoint, `${origin}${path}`);
  assert.equal(page.clients.length, 0);
  const unauthenticated = await mcpCall(agentId, { method: "tools/list" });
  assert.equal(unauthenticated.status, 401);
  assert.match(unauthenticated.headers.get("www-authenticate") ?? "", /oauth-protected-resource/);
  const metadata = await getJson<{ resource: string; authorization_servers: string[] }>(
    `/.well-known/oauth-protected-resource${path}`,
  );
  assert.equal(metadata.resource, page.endpoint);
  assert.equal(metadata.authorization_servers[0], `${origin}/api/auth`);
  const first = await issueGrantedKey(agentId, "Codex key", login);
  const second = await issueGrantedKey(agentId, "OpenClaw key", login);
  for (const key of [first.token, second.token]) {
    const response = await mcpCall(agentId, { method: "tools/list" }, key);
    assert.equal(response.status, 200, await response.clone().text());
    const body = (await response.json()) as { result: { tools: { name: string }[] } };
    const names = body.result.tools.map((tool) => tool.name);
    assert.ok(names.includes("get_balances"));
    assert.ok(names.includes("get_policy"));
    assert.ok(names.includes("intents_transfer"));
    assert.ok(
      !names.includes("transfer") &&
        !names.includes("sign_message") &&
        !names.includes("get_budget") &&
        !names.includes("get_limits") &&
        !names.includes("set_policy"),
    );
  }
  assert.equal(
    (await mcpCall(stub.unboundAgentId, { method: "tools/list" }, first.token)).status,
    401,
  );
  const foreign = await browserPost(
    `/api/agents/${"b".repeat(64)}/mcp/challenge`,
    { name: "foreign" },
    login.cookie,
  );
  assert.equal(foreign.status, 404);
  const unbound = await browserPost(
    `/api/agents/${stub.unboundAgentId}/mcp/challenge`,
    { name: "unbound" },
    login.cookie,
  );
  assert.equal(unbound.status, 409);
  const unsigned = await browserPost(
    `${path}/authorize`,
    { clientAccessId: first.clientAccessId, challengeId: "fake" },
    login.cookie,
  );
  assert.equal(unsigned.status, 200); // Existing authority cannot mint another key.
  if (unsigned.ok) assert.equal((await unsigned.json()).token, null);
  const revoked = await getJson<{ generated: GenerateIntentResponse; revoked: boolean }>(
    `${path}/clients/${first.clientAccessId}`,
    { method: "POST", cookie: login.cookie, body: {} },
  );
  assert.equal(revoked.revoked, false);
  assert.equal((await mcpCall(agentId, { method: "tools/list" }, first.token)).status, 401);
  assert.equal((await mcpCall(agentId, { method: "tools/list" }, second.token)).status, 200);
  await getJson(`${path}/clients/${first.clientAccessId}`, {
    method: "POST",
    cookie: login.cookie,
    body: { signedData: login.owner.signIntent(revoked.generated.intent) },
  });
  assert.equal((await mcpCall(agentId, { method: "tools/list" }, second.token)).status, 200);

  const codex = await beginOAuth(agentId, "Codex", "", undefined, login);
  const openclaw = await beginOAuth(agentId, "OpenClaw", login.cookie);
  const forged = new URLSearchParams(codex.oauthQuery);
  forged.set("client_id", openclaw.clientId);
  const forgedResponse = await browserPost(
    `${path}/challenge`,
    { oauthQuery: forged.toString() },
    login.cookie,
  );
  assert.equal(forgedResponse.status, 400);
  const foreignResource = new URLSearchParams(codex.oauthQuery);
  foreignResource.set("resource", `https://evil.test${path}`);
  assert.equal(
    (
      await browserPost(
        `${path}/challenge`,
        { oauthQuery: foreignResource.toString() },
        login.cookie,
      )
    ).status,
    404,
  );
  const prepared = await prepareOAuth(agentId, codex.oauthQuery, login.cookie);
  assert.equal(
    (
      await browserPost(
        `${path}/authorize`,
        { clientAccessId: prepared.clientAccessId, oauthQuery: codex.oauthQuery },
        login.cookie,
      )
    ).status,
    409,
  );
  const consentBypass = await browserPost(
    "/api/auth/oauth2/consent",
    { accept: true, oauth_query: codex.oauthQuery },
    login.cookie,
  );
  assert.ok(consentBypass.ok);
  const bypassBody = (await consentBypass.json()) as { redirect_uri?: string; url?: string };
  const bypassToken = await exchangeOAuth(
    codex,
    (bypassBody.redirect_uri ?? bypassBody.url) as string,
  );
  assert.equal(
    bypassToken.status,
    403,
    "OAuth consent without owner grant cannot mint execution credentials",
  );

  const codexTokens = await completeOAuth(agentId, codex, login, prepared);
  const clawPrepared = await prepareOAuth(agentId, openclaw.oauthQuery, login.cookie);
  const clawTokens = await completeOAuth(agentId, openclaw, login, clawPrepared);
  await mcpProtocolFlow(agentId, codexTokens.access_token, second.token);
  for (const token of [codexTokens.access_token, clawTokens.access_token])
    assert.equal((await mcpCall(agentId, { method: "tools/list" }, token)).status, 200);
  assert.equal(
    (await mcpCall(stub.unboundAgentId, { method: "tools/list" }, codexTokens.access_token)).status,
    401,
  );
  const call = await mcpCall(
    agentId,
    { method: "tools/call", params: { name: "get_balances", arguments: { source: "public" } } },
    clawTokens.access_token,
  );
  assert.equal(call.status, 200, await call.clone().text());
  const toolBody = (await call.json()) as { error?: unknown; result?: { isError?: boolean } };
  assert.ok(toolBody.result && !toolBody.result.isError, JSON.stringify(toolBody));
  const activity = await getJson<{
    clients: { name: string; status: string; lastUsedAt: string | null }[];
    activity: { clientName: string }[];
  }>(path, { cookie: login.cookie });
  assert.ok(
    activity.clients.some(
      (client) => client.name === "OpenClaw" && client.status === "authorized" && client.lastUsedAt,
    ),
  );
  assert.equal(activity.activity[0]?.clientName, "OpenClaw");
  const closeCodex = await getJson<{ generated: GenerateIntentResponse }>(
    `${path}/clients/${prepared.clientAccessId}`,
    { method: "POST", cookie: login.cookie, body: {} },
  );
  assert.equal(
    (await mcpCall(agentId, { method: "tools/list" }, codexTokens.access_token)).status,
    403,
  );
  assert.equal(
    (await mcpCall(agentId, { method: "tools/list" }, clawTokens.access_token)).status,
    200,
  );
  const staleRefresh = await refreshOAuth(codex.clientId, codexTokens.refresh_token, page.endpoint);
  assert.equal(staleRefresh.ok, false);
  const clawRefresh = await refreshOAuth(
    openclaw.clientId,
    clawTokens.refresh_token,
    page.endpoint,
  );
  assert.equal(clawRefresh.status, 200, await clawRefresh.clone().text());
  await getJson(`${path}/clients/${prepared.clientAccessId}`, {
    method: "POST",
    cookie: login.cookie,
    body: { signedData: login.owner.signIntent(closeCodex.generated.intent) },
  });
  const reconnect = await beginOAuth(agentId, "Codex", login.cookie, codex.clientId);
  const next = await prepareOAuth(agentId, reconnect.oauthQuery, login.cookie);
  assert.notEqual(next.clientAccessId, prepared.clientAccessId);
  const replacement = await completeOAuth(agentId, reconnect, login, next);
  assert.equal(
    (await mcpCall(agentId, { method: "tools/list" }, replacement.access_token)).status,
    200,
  );
  assert.equal(
    (await mcpCall(agentId, { method: "tools/list" }, codexTokens.access_token)).status,
    403,
    "reconnect never revives old generation",
  );
  assert.equal(
    (await fetch(`${origin}/api/mcp/connections`, { headers: { cookie: login.cookie } })).status,
    404,
  );
  assert.equal((await fetch(`${origin}/mcp`, { headers: { cookie: login.cookie } })).status, 404);
  await interruptedAuthorization(stub, databaseUrl, login, second);
}

async function interruptedAuthorization(
  stub: Awaited<ReturnType<typeof startStubAgentApi>>,
  databaseUrl: string,
  login: Login,
  key: { token: string; clientAccessId: string },
) {
  const database = createDemoDatabase(databaseUrl);
  const agentId = stub.ownerAgentId;
  const path = `/api/agents/${agentId}/mcp`;
  try {
    await database.db
      .update(mcpClientAccess)
      .set({ expiresAt: new Date(0) })
      .where(eq(mcpClientAccess.id, key.clientAccessId));
    assert.equal((await mcpCall(agentId, { method: "tools/list" }, key.token)).status, 401);
    const draft = await getJson<GrantPreparation>(`${path}/challenge`, {
      method: "POST",
      cookie: login.cookie,
      body: { name: "Interrupted key" },
    });
    const resumed = await getJson<GrantPreparation>(`${path}/challenge`, {
      method: "POST",
      cookie: login.cookie,
      body: { clientAccessId: draft.clientAccessId },
    });
    assert.equal(
      resumed.generated.correlation_id,
      draft.generated.correlation_id,
      "canceling signing never creates another grant",
    );
    assert.equal(
      (
        await database.db
          .select()
          .from(mcpClientAccess)
          .where(eq(mcpClientAccess.id, draft.clientAccessId))
      )[0]?.status,
      "pending",
    );
    const proof = login.owner.signIntent(resumed.generated.intent);
    stub.loseNextSubmissionResponse();
    const lost = await browserPost(
      `${path}/authorize`,
      {
        clientAccessId: resumed.clientAccessId,
        challengeId: resumed.challengeId,
        signedData: proof,
      },
      login.cookie,
    );
    assert.equal(lost.status, 503);
    const before = stub.submissions();
    const recovered = await getJson<{ token: string }>(`${path}/authorize`, {
      method: "POST",
      cookie: login.cookie,
      body: { clientAccessId: resumed.clientAccessId },
    });
    assert.match(recovered.token, /^mcp_/);
    assert.equal(
      stub.submissions(),
      before,
      "lost response recovery observes without replaying proof",
    );
    assert.equal(
      (
        await browserPost(
          `${path}/authorize`,
          {
            clientAccessId: resumed.clientAccessId,
            challengeId: resumed.challengeId,
            signedData: proof,
          },
          login.cookie,
        )
      ).status,
      409,
    );
    assert.equal((await mcpCall(agentId, { method: "tools/list" }, recovered.token)).status, 200);

    await failedRevocation(stub, login, resumed.clientAccessId, recovered.token);
    const expired = await getJson<GrantPreparation>(`${path}/challenge`, {
      method: "POST",
      cookie: login.cookie,
      body: { name: "Expired challenge" },
    });
    await database.db
      .update(challengeTable)
      .set({ expiresAt: new Date(0) })
      .where(eq(challengeTable.id, expired.challengeId));
    assert.equal(
      (
        await browserPost(
          `${path}/authorize`,
          {
            clientAccessId: expired.clientAccessId,
            challengeId: expired.challengeId,
            signedData: login.owner.signIntent(expired.generated.intent),
          },
          login.cookie,
        )
      ).status,
      409,
    );

    const failed = await beginOAuth(agentId, "Interrupted OAuth", login.cookie);
    const pending = await prepareOAuth(agentId, failed.oauthQuery, login.cookie);
    stub.onNextSubmission(async () => {
      await database.db
        .update(oauthClient)
        .set({ disabled: true })
        .where(eq(oauthClient.clientId, failed.clientId));
    });
    const incomplete = await browserPost(
      `${path}/authorize`,
      {
        clientAccessId: pending.clientAccessId,
        challengeId: pending.challengeId,
        signedData: login.owner.signIntent(pending.generated.intent),
        oauthQuery: failed.oauthQuery,
      },
      login.cookie,
    );
    assert.equal(incomplete.status, 409, await incomplete.clone().text());
    assert.equal(
      (
        await database.db
          .select()
          .from(mcpClientAccess)
          .where(eq(mcpClientAccess.id, pending.clientAccessId))
      )[0]?.status,
      "pending",
      "failed OAuth completion never activates access",
    );
    await database.db
      .update(oauthClient)
      .set({ disabled: false })
      .where(eq(oauthClient.clientId, failed.clientId));
    const retry = await beginOAuth(agentId, "Interrupted OAuth", login.cookie, failed.clientId);
    const saved = await prepareOAuth(agentId, retry.oauthQuery, login.cookie);
    assert.equal(saved.generated.correlation_id, pending.generated.correlation_id);
    const done = await getJson<{ redirect_uri: string }>(`${path}/authorize`, {
      method: "POST",
      cookie: login.cookie,
      body: { clientAccessId: saved.clientAccessId, oauthQuery: retry.oauthQuery },
    });
    const exchange = await exchangeOAuth(retry, done.redirect_uri);
    assert.equal(exchange.status, 200, await exchange.clone().text());
    const token = (await exchange.json()).access_token as string;
    assert.equal((await mcpCall(agentId, { method: "tools/list" }, token)).status, 200);
    const reconsent = await beginOAuth(agentId, "Interrupted OAuth", login.cookie, failed.clientId);
    const reuse = await prepareOAuth(agentId, reconsent.oauthQuery, login.cookie);
    assert.equal(reuse.clientAccessId, saved.clientAccessId);
    const retained = await getJson<{ redirect_uri: string }>(`${path}/authorize`, {
      method: "POST",
      cookie: login.cookie,
      body: { clientAccessId: reuse.clientAccessId, oauthQuery: reconsent.oauthQuery },
    });
    assert.equal((await exchangeOAuth(reconsent, retained.redirect_uri)).status, 200);
  } finally {
    await database.close();
  }
}

async function failedRevocation(
  stub: Awaited<ReturnType<typeof startStubAgentApi>>,
  login: Login,
  clientAccessId: string,
  token: string,
) {
  const path = `/api/agents/${stub.ownerAgentId}/mcp/clients/${clientAccessId}`;
  const prepared = await getJson<{ generated: GenerateIntentResponse }>(path, {
    method: "POST",
    cookie: login.cookie,
    body: {},
  });
  assert.equal((await mcpCall(stub.ownerAgentId, { method: "tools/list" }, token)).status, 401);
  stub.failNextSubmission();
  const failed = await getJson<{ revoked: boolean }>(path, {
    method: "POST",
    cookie: login.cookie,
    body: { signedData: login.owner.signIntent(prepared.generated.intent) },
  });
  assert.equal(failed.revoked, false);
  const retry = await getJson<{ generated: GenerateIntentResponse; submitted: boolean }>(path, {
    method: "POST",
    cookie: login.cookie,
    body: {},
  });
  assert.notEqual(retry.generated.correlation_id, prepared.generated.correlation_id);
  assert.equal(retry.submitted, false);
  stub.loseNextSubmissionResponse();
  assert.equal(
    (
      await browserPost(
        path,
        { signedData: login.owner.signIntent(retry.generated.intent) },
        login.cookie,
      )
    ).status,
    503,
  );
  const count = stub.submissions();
  const completed = await getJson<{ revoked: boolean }>(path, {
    method: "POST",
    cookie: login.cookie,
    body: {},
  });
  assert.equal(completed.revoked, true);
  assert.equal(
    stub.submissions(),
    count,
    "revocation observes a lost successful response without another proof dispatch",
  );
  assert.equal((await mcpCall(stub.ownerAgentId, { method: "tools/list" }, token)).status, 401);
}

type GrantPreparation = {
  clientAccessId: string;
  challengeId: string;
  generated: GenerateIntentResponse;
};
type Login = { cookie: string; userId: string; owner: EvmOwner };
type OAuthStart = { clientId: string; verifier: string; oauthQuery: string; resource: string };

function browserPost(path: string, body: unknown, cookie: string) {
  return fetch(`${origin}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin, cookie },
    body: JSON.stringify(body),
  });
}

async function issueGrantedKey(agentId: string, name: string, login: Login) {
  const path = `/api/agents/${agentId}/mcp`;
  const prepared = await getJson<GrantPreparation>(`${path}/challenge`, {
    method: "POST",
    body: { name },
    cookie: login.cookie,
  });
  assert.equal(
    (
      await browserPost(
        `${path}/authorize`,
        { clientAccessId: prepared.clientAccessId, challengeId: prepared.challengeId },
        login.cookie,
      )
    ).status,
    409,
  );
  const issued = await getJson<{ token: string }>(`${path}/authorize`, {
    method: "POST",
    body: {
      clientAccessId: prepared.clientAccessId,
      challengeId: prepared.challengeId,
      signedData: login.owner.signIntent(prepared.generated.intent),
    },
    cookie: login.cookie,
  });
  assert.match(issued.token, /^mcp_/);
  return { ...issued, clientAccessId: prepared.clientAccessId };
}

async function beginOAuth(
  agentId: string,
  name: string,
  cookie: string,
  existingClientId?: string,
  signingLogin?: Login,
): Promise<OAuthStart> {
  const registered = existingClientId
    ? { client_id: existingClientId }
    : await getJson<{ client_id: string }>("/api/auth/oauth2/register", {
        method: "POST",
        body: {
          client_name: name,
          redirect_uris: ["https://client.example.test/callback"],
          token_endpoint_auth_method: "none",
          grant_types: ["authorization_code", "refresh_token"],
          response_types: ["code"],
          scope: "agent:full offline_access",
        },
      });
  const verifier = randomBytes(32).toString("base64url");
  const resource = `${origin}/api/agents/${agentId}/mcp`;
  const query = new URLSearchParams({
    client_id: registered.client_id,
    response_type: "code",
    redirect_uri: "https://client.example.test/callback",
    scope: "agent:full offline_access",
    resource,
    code_challenge: createHash("sha256").update(verifier).digest("base64url"),
    code_challenge_method: "S256",
    state: crypto.randomUUID(),
    prompt: "consent",
  });
  let response = await fetch(`${origin}/api/auth/oauth2/authorize?${query}`, {
    headers: { cookie, accept: "text/html", "sec-fetch-mode": "navigate" },
    redirect: "manual",
  });
  if (!cookie && signingLogin) {
    const loginLocation =
      response.headers.get("location") ?? ((await response.clone().json()) as { url?: string }).url;
    assert.ok(loginLocation, `OAuth login ${response.status}: ${await response.clone().text()}`);
    const loginUrl = new URL(loginLocation, origin);
    assert.equal(loginUrl.pathname, "/login");
    const resume = pendingAuthorizationUrl(loginUrl.search);
    assert.ok(resume);
    const refreshedLogin = await evmLogin(signingLogin.owner);
    assert.equal(
      refreshedLogin.userId,
      signingLogin.userId,
      "OAuth sign-in resolves the same account owner",
    );
    signingLogin.cookie = refreshedLogin.cookie;
    response = await fetch(`${origin}${resume}`, {
      headers: { cookie: refreshedLogin.cookie, accept: "text/html" },
      redirect: "manual",
    });
  }
  const location =
    response.headers.get("location") ?? ((await response.clone().json()) as { url?: string }).url;
  assert.ok(location, `OAuth authorize ${response.status}: ${await response.clone().text()}`);
  const url = new URL(location, origin);
  assert.equal(url.pathname, "/consent", location);
  return {
    clientId: registered.client_id,
    verifier,
    oauthQuery: url.searchParams.toString(),
    resource,
  };
}

const prepareOAuth = (agentId: string, oauthQuery: string, cookie: string) =>
  getJson<GrantPreparation>(`/api/agents/${agentId}/mcp/challenge`, {
    method: "POST",
    body: { oauthQuery },
    cookie,
  });
async function completeOAuth(
  agentId: string,
  start: OAuthStart,
  login: Login,
  prepared: GrantPreparation,
) {
  const authorized = await getJson<{ redirect_uri: string }>(
    `/api/agents/${agentId}/mcp/authorize`,
    {
      method: "POST",
      cookie: login.cookie,
      body: {
        clientAccessId: prepared.clientAccessId,
        challengeId: prepared.challengeId,
        signedData: login.owner.signIntent(prepared.generated.intent),
        oauthQuery: start.oauthQuery,
      },
    },
  );
  const response = await exchangeOAuth(start, authorized.redirect_uri);
  assert.equal(response.status, 200, await response.clone().text());
  return (await response.json()) as { access_token: string; refresh_token: string };
}
function exchangeOAuth(start: OAuthStart, redirect: string) {
  const code = new URL(redirect).searchParams.get("code");
  assert.ok(code, redirect);
  return fetch(`${origin}/api/auth/oauth2/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: start.clientId,
      code,
      code_verifier: start.verifier,
      redirect_uri: "https://client.example.test/callback",
      resource: start.resource,
    }),
  });
}
function refreshOAuth(clientId: string, refreshToken: string, resource: string) {
  return fetch(`${origin}/api/auth/oauth2/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      refresh_token: refreshToken,
      resource,
    }),
  });
}

async function mcpProtocolFlow(agentId: string, oauthToken: string, key: string) {
  for (const version of ["2025-06-18", "2026-07-28"]) {
    for (const token of [oauthToken, key]) {
      const discovery =
        version === "2025-06-18"
          ? {
              method: "initialize",
              params: {
                protocolVersion: version,
                capabilities: {},
                clientInfo: { name: "Codex", version: "1" },
              },
            }
          : { method: "server/discover" };
      const initialized = await mcpResult(await mcpCall(agentId, discovery, token, version));
      if (version === "2025-06-18") assert.equal(initialized.protocolVersion, version);
      else assert.ok(initialized.supportedVersions.includes(version));
      const listed = await mcpResult(
        await mcpCall(agentId, { method: "tools/list" }, token, version),
      );
      assert.ok(listed.tools.some((tool: { name: string }) => tool.name === "get_balances"));
      for (const source of ["public", "confidential"]) {
        const result = await mcpResult(
          await mcpCall(
            agentId,
            {
              method: "tools/call",
              params: { name: "get_balances", arguments: { source } },
            },
            token,
            version,
          ),
        );
        assert.ok(!result.isError, JSON.stringify(result));
        assert.ok(result.structuredContent.data);
      }
    }
  }
}

async function mcpResult(response: Response) {
  const text = await response.text();
  assert.equal(response.status, 200, text);
  const payload = response.headers.get("content-type")?.includes("text/event-stream")
    ? text
        .split("\n")
        .find((line) => line.startsWith("data: "))
        ?.slice(6)
    : text;
  assert.ok(payload, text);
  const body = JSON.parse(payload);
  assert.ok(body.result && !body.error, payload);
  return body.result;
}

function mcpCall(
  agentId: string,
  payload: unknown,
  token?: string,
  version = "2026-07-28",
): Promise<Response> {
  const request = payload as { method: string; params?: Record<string, unknown> };
  const modern = version === "2026-07-28";
  return fetch(`${origin}/api/agents/${agentId}/mcp`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      ...(request.method === "initialize" ? {} : { "mcp-protocol-version": version }),
      ...(modern
        ? {
            "mcp-method": request.method,
            ...(typeof request.params?.name === "string"
              ? { "mcp-name": request.params.name }
              : {}),
          }
        : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: request.method,
      params: {
        ...(request.params ?? {}),
        ...(modern
          ? {
              _meta: {
                "io.modelcontextprotocol/protocolVersion": version,
                "io.modelcontextprotocol/clientCapabilities": {},
              },
            }
          : {}),
      },
    }),
  });
}

/** Signs an EVM SIWE message and returns the session cookie plus the signing owner. */
async function evmLogin(
  owner = evmOwner(),
): Promise<{ cookie: string; userId: string; owner: EvmOwner }> {
  const challenge = await getJson<{ nonce: string }>("/api/auth/siwe/nonce", {
    method: "POST",
    body: {},
  });
  const message = siweMessage({
    origin,
    nonce: challenge.nonce,
    address: owner.address,
    chainId: 1,
  });
  const verify = await fetch(`${origin}/api/auth/siwe/verify`, {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ message, signature: owner.sign(message) }),
  });
  assert.equal(verify.status, 200, await verify.clone().text());
  const cookie = verify.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  assert.match(cookie, /better-auth\.session_token/);
  const session = await getJson<{ session: { userId: string } }>("/api/auth/session", { cookie });
  return { cookie, userId: session.session.userId, owner };
}

async function passkeyFlow(restart: () => Promise<void>): Promise<void> {
  const authenticator = syntheticPasskey();

  // 1. Register. The plugin's options endpoint stores the WebAuthn challenge in a signed
  // cookie; the browser sends it back with verification, so this test carries it too.
  const registration = await challenge("/api/auth/passkey/generate-register-options?name=Test");
  const verify = await fetch(`${origin}/api/auth/passkey/verify-registration`, {
    method: "POST",
    headers: { "content-type": "application/json", origin, cookie: registration.cookie },
    body: JSON.stringify({
      response: authenticator.registration({
        challenge: registration.challenge,
        rpId: "localhost",
        origin,
      }),
      name: "Test passkey",
      createSession: true,
    }),
  });
  assert.equal(verify.status, 200, await verify.clone().text());
  const sessionCookie = sessionCookieFrom(verify);
  assert.ok(sessionCookie, "registration signs the new user in");

  // 3. The session resolves the passkey owner descriptor the Agent API verifies.
  const sessionBody = await getJson<{
    session: { owner: { type: string; credential_id: string; rp_id: string; origin: string } };
  }>("/api/auth/session", { cookie: sessionCookie });
  assert.equal(sessionBody.session.owner.type, "passkey");
  assert.equal(sessionBody.session.owner.credential_id, authenticator.credentialId);
  assert.equal(sessionBody.session.owner.rp_id, "localhost");
  assert.equal(sessionBody.session.owner.origin, origin);
  assert.equal(JSON.stringify(sessionBody).includes("naa_"), false, "no API key in session");

  // 4. Sign out deletes the session row, so the cookie cannot be replayed.
  const signOut = await fetch(`${origin}/api/auth/sign-out`, {
    method: "POST",
    headers: { "content-type": "application/json", origin, cookie: sessionCookie },
    body: "{}",
  });
  assert.equal(signOut.status, 200);
  assert.equal(
    (await getJson<{ session: unknown }>("/api/auth/session", { cookie: sessionCookie })).session,
    null,
  );
  // Restart the single disk-owning process before authenticating with the persisted passkey.
  await restart();

  // 5. Sign back in with the same credential and an advanced counter.
  const login = await challenge("/api/auth/passkey/generate-authenticate-options");
  const authentication = await fetch(`${origin}/api/auth/passkey/verify-authentication`, {
    method: "POST",
    headers: { "content-type": "application/json", origin, cookie: login.cookie },
    body: JSON.stringify({
      response: authenticator.authentication({
        challenge: login.challenge,
        rpId: "localhost",
        origin,
      }),
    }),
  });
  assert.equal(authentication.status, 200, await authentication.clone().text());
  assert.ok(sessionCookieFrom(authentication), "second sign-in issues a session");
  // 6. Replaying with the already-consumed challenge and cookie must fail.
  const replay = await fetch(`${origin}/api/auth/passkey/verify-authentication`, {
    method: "POST",
    headers: { "content-type": "application/json", origin, cookie: login.cookie },
    body: JSON.stringify({
      response: authenticator.authentication({
        challenge: login.challenge,
        rpId: "localhost",
        origin,
      }),
    }),
  });
  assert.notEqual(replay.status, 200, "replay of a consumed challenge fails");
}

type EvmOwner = {
  publicKey: `0x${string}`;
  address: `0x${string}`;
  sign(message: string): string;
  signIntent(intent: Intent): SignedData;
};

function evmOwner(): EvmOwner {
  const key = secp256k1.keygen();
  const publicKey = secp256k1.getPublicKey(key.secretKey, false);
  const address = `0x${Buffer.from(keccak_256(publicKey.subarray(1)))
    .subarray(12)
    .toString("hex")}`;
  return {
    address: address as `0x${string}`,
    publicKey: `0x${Buffer.from(publicKey.subarray(1)).toString("hex")}`,
    signIntent: evmIntentSigner(Buffer.from(key.secretKey).toString("hex")).sign,
    sign(message: string) {
      const bytes = Buffer.from(message);
      const digest = keccak_256(
        Buffer.concat([Buffer.from(`\x19Ethereum Signed Message:\n${bytes.length}`), bytes]),
      );
      const signed = secp256k1.sign(digest, key.secretKey, { prehash: false, format: "recovered" });
      return `0x${Buffer.concat([signed.subarray(1), Buffer.from([(signed[0] ?? 0) + 27])]).toString("hex")}`;
    },
  };
}

function siweMessage(input: { origin: string; nonce: string; address: string; chainId: number }) {
  const url = new URL(input.origin);
  return [
    `${url.host} wants you to sign in with your Ethereum account:`,
    input.address,
    "",
    "Sign in to NEAR Agent Connect. This does not authorize any transfer.",
    "",
    `URI: ${url.origin}`,
    "Version: 1",
    `Chain ID: ${input.chainId}`,
    `Nonce: ${input.nonce}`,
    `Issued At: ${new Date().toISOString()}`,
  ].join("\n");
}

async function getJson<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    cookie?: string;
    headers?: Record<string, string>;
  } = {},
): Promise<T> {
  const response = await fetch(`${origin}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "content-type": "application/json",
      // The demo BFF requires the exact browser origin on mutations, so every JSON call that
      // can mutate supplies it; this mirrors what the browser sends.
      origin,
      ...(options.cookie ? { cookie: options.cookie } : {}),
      ...(options.headers ?? {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  assert.ok(response.ok, `${path} -> ${response.status} ${await response.clone().text()}`);
  return (await response.json()) as T;
}

/**
 * Fetches a challenge endpoint once and returns both the challenge and the signed cookie that
 * verification must present. Fetching twice would rotate the challenge and fail verification.
 */
async function challenge(path: string): Promise<{ challenge: string; cookie: string }> {
  const response = await fetch(`${origin}${path}`);
  assert.ok(response.ok, `${path} -> ${response.status} ${await response.clone().text()}`);
  const cookie = response.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  assert.match(cookie, /better-auth-passkey/, "challenge cookie issued");
  const body = (await response.json()) as { challenge: string };
  assert.ok(body.challenge, "challenge issued");
  return { challenge: body.challenge, cookie };
}

function sessionCookieFrom(response: Response): string | null {
  const cookie = response.headers
    .getSetCookie()
    .find((value) => value.startsWith("better-auth.session_token"));
  return cookie ? (cookie.split(";")[0] ?? null) : null;
}

async function startDemoServer(
  agentApiUrl: string,
  directory: string,
  databaseUrl: string,
): Promise<ReturnType<typeof spawn>> {
  const server = spawn(
    process.execPath,
    [resolve(app, "node_modules/next/dist/bin/next"), "start", "--port", String(port)],
    {
      cwd: directory,
      env: {
        PATH: process.env.PATH,
        HOME: process.env.HOME,
        NODE_ENV: "production",
        DATABASE_URL: databaseUrl,
        BETTER_AUTH_SECRET: "test-only-demo-auth-secret-32-chars",
        SECRET_ENCRYPTION_KEY: "test-only-demo-encryption-key-32-chars",
        NEAR_INTENTS_AGENT_API_URL: agentApiUrl,
        NEAR_INTENTS_AGENT_API_KEY: `naa_${"x".repeat(43)}`,
      },
    },
  );
  let output = "";
  await new Promise<void>((resolve, reject) => {
    server.stdout?.on("data", (chunk) => {
      output += chunk;
      if (output.includes("Ready in")) resolve();
    });
    server.stderr?.on("data", (chunk) => {
      output += chunk;
    });
    server.once("exit", (code) => reject(new Error(`demo startup failed (${code}): ${output}`)));
  });
  return server;
}

/**
 * Minimal Agent API stub: reports mainnet and returns one agent for the signed-in user plus one
 * for a different user, both under the same tenant key. Real agent responses come from the
 * Agent API contract; only the fields the demo reads are present.
 *
 * The stub also serves the multi-asset balance list, token catalog and pending approvals so
 * the BFF's provider-facing routes are exercised through real HTTP, not just unit-tested.
 */
async function startStubAgentApi(): Promise<{
  submissions: () => number;
  loseNextSubmissionResponse: () => void;
  failNextSubmission: () => void;
  onNextSubmission: (callback: () => Promise<void>) => void;
  url: string;
  ownerAgentId: string;
  unboundAgentId: string;
  setOwner: (userId: string) => void;
  close: () => Promise<void>;
}> {
  const http = await import("node:http");
  const ownAgentId = "a".repeat(64);
  // A second own agent that is deliberately unbound, so the consent gate can be exercised.
  const unboundOwnAgentId = "d".repeat(64);
  let ownerUserId = "unset-owner";
  let grantCount = 0;
  let submissions = 0;
  let lostSubmissionResponse = false;
  let failedSubmission = false;
  let nextSubmission: (() => Promise<void>) | null = null;
  const pending = new Map<
    string,
    { generated: GenerateIntentResponse; request: Record<string, unknown>; index: number }
  >();
  const statuses = new Map<string, Record<string, unknown>>();
  const grants: Array<Record<string, unknown> & { revoked_at: string | null }> = [];
  let depositCount = 0;
  const agent = (externalUserId: string, id: string) => ({
    id,
    name: `agent-${externalUserId}`,
    external_user_id: externalUserId,
    deleted: false,
    archived: false,
    status: id === unboundOwnAgentId ? "PENDING" : "ACTIVE",
    owner:
      id === unboundOwnAgentId
        ? null
        : {
            type: "evm" as const,
            address: `0x${"1".repeat(40)}`,
            chain_id: 1,
            public_key: `0x${"2".repeat(128)}`,
          },
    owner_account: {
      account_id: "owner.near",
      public_key: `ed25519:${"2".repeat(64)}`,
      authority: "wallet" as const,
    },
    wallet:
      id === unboundOwnAgentId
        ? null
        : {
            wallet_id: "wallet-stub",
            near_account_id: "c".repeat(64),
          },
    created_at: new Date().toISOString(),
    cooldowns: { policy_change_available_at: null, unfreeze_available_at: null },
  });
  const routes: Array<{
    match: (url: URL, method: string) => boolean;
    respond: (url: URL, requestBody: unknown) => { status?: number; body: unknown };
  }> = [
    {
      match: (url) => url.pathname === "/v1/network",
      respond: () => ({
        body: {
          network: "mainnet",
          supported_owner_types: ["near", "evm", "passkey"],
          contract_id: "outlayer.near",
          policy_authorization: "wallet_signature",
          policy_controller: null,
          native_execution: "outlayer_custody_with_owner_wallet_authorization",
        },
      }),
    },
    {
      // The BFF asks for one external user; the stub also returns a foreign agent under the
      // same tenant key, so the demo's in-process filter is what must exclude it.
      match: (url, method) => url.pathname === "/v1/agents" && method === "GET",
      respond: (url) => {
        const requested = url.searchParams.get("external_user_id") ?? "unknown";
        return {
          body: {
            next_cursor: null,
            data: [
              agent(requested, ownAgentId),
              agent(requested, unboundOwnAgentId),
              agent("someone-else", "b".repeat(64)),
            ],
          },
        };
      },
    },
    {
      match: (url) => /^\/v1\/agents\/[0-9a-f]{64}$/.test(url.pathname),
      respond: (url) => {
        // Only the "a…" and "d…" agents belong to the signed-in test user.
        const id = url.pathname.split("/").pop() ?? "";
        const externalUserId = [ownAgentId, unboundOwnAgentId].includes(id)
          ? ownerUserId
          : "someone-else";
        return { body: agent(externalUserId, id) };
      },
    },
    {
      match: (url) => url.pathname.endsWith("/balances"),
      respond: (url) => ({
        body: {
          near_account_id: "c".repeat(64),
          source: url.searchParams.get("source") ?? "public",
          balances: [{ asset: "nep141:wrap.near", balance: "42", symbol: "wNEAR", decimals: 24 }],
        },
      }),
    },
    {
      match: (url) => url.pathname.endsWith("/approvals"),
      respond: () => ({ body: { data: [] } }),
    },
    {
      match: (url) => url.pathname.endsWith("/policy"),
      respond: () => ({
        body: {
          wallet_id: "wallet-stub",
          policy_hash: null,
          revision: null,
          status: "NONE",
          applied_at: null,
          transaction_hash: null,
          provider_policy_synced: false,
          policy: null,
          usage: {
            budget: {
              daily: {
                limit_usd: null,
                spent_usd: "0.000000",
                remaining_usd: null,
                resets_at: null,
              },
              weekly: {
                limit_usd: null,
                spent_usd: "0.000000",
                remaining_usd: null,
                resets_at: null,
              },
              monthly: {
                limit_usd: null,
                spent_usd: "0.000000",
                remaining_usd: null,
                resets_at: null,
              },
            },
            timelock: { delay_ms: 0, scheduled_count: 0 },
          },
        },
      }),
    },
    {
      match: (url) => url.pathname === "/v1/generate-intent",
      respond: (_url, body) => {
        const request = body as Record<string, unknown>;
        assert.ok(request.type === "grant_issue" || request.type === "grant_revoke");
        if (request.type === "grant_issue") {
          assert.match(request.label as string, /^MCP: /);
          assert.match(request.credential as string, /^[0-9a-f]{64}$/);
          assert.equal("actions" in request, false, "a grant names who acts; policy decides what");
          assert.equal(
            "recipients" in request,
            false,
            "a grant names who acts; policy decides where",
          );
        }
        grantCount++;
        const generated = {
          correlation_id: crypto.randomUUID(),
          type: request.type,
          agent_id: request.agent_id,
          status: "PENDING_SIGNATURE",
          expires_at: new Date(Date.now() + 300_000).toISOString(),
          signer: agent(ownerUserId, ownAgentId).owner,
          intent: {
            standard: "eip712",
            payload: {
              domain: { name: "Grant" },
              types: {
                EIP712Domain: [{ name: "name", type: "string" }],
                Grant: [{ name: "terms", type: "string" }],
              },
              primaryType: "Grant",
              message: { terms: JSON.stringify(request) },
            },
          },
          preview: { summary: "Authorize MCP client" },
        } as unknown as GenerateIntentResponse;
        pending.set(generated.correlation_id, { generated, request, index: grantCount });
        statuses.set(generated.correlation_id, {
          correlation_id: generated.correlation_id,
          type: request.type,
          agent_id: request.agent_id,
          status: "PENDING_SIGNATURE",
          failure_code: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          details: {},
        });
        return { body: generated };
      },
    },
    {
      match: (url) => url.pathname.endsWith("/deposit"),
      respond: (_url, body) => {
        const input = body as { confidential: boolean; refund_to?: string };
        assert.equal(input.refund_to, undefined, "refunds go to the agent; none is named");
        const correlationId = "de".repeat(31) + (++depositCount).toString(16).padStart(2, "0");
        const status = {
          correlation_id: correlationId,
          type: "deposit",
          agent_id: ownAgentId,
          status: "PENDING_DEPOSIT",
          failure_code: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          grant: null,
          details: {
            action: "cross_chain_deposit",
            deposit_address: "deposit.near",
            confidential: input.confidential,
          },
        };
        statuses.set(correlationId, status);
        return { body: status };
      },
    },
    {
      match: (url) => url.pathname === "/v1/status",
      respond: (url) => ({
        body: statuses.get(url.searchParams.get("correlation_id") ?? "") ?? { status: "FAILED" },
      }),
    },
    {
      match: (url) => url.pathname === "/v1/submit-intent",
      respond: (_url, body) => {
        const submitted = body as { correlation_id: string; signed_data: SignedData };
        const stored = pending.get(submitted.correlation_id);
        assert.ok(stored);
        assert.deepEqual(submitted.signed_data.payload, stored.generated.intent.payload);
        const existing = statuses.get(submitted.correlation_id);
        if (existing?.status === "SUCCESS") return { body: existing };
        if (failedSubmission) {
          failedSubmission = false;
          const failure = {
            ...existing,
            status: "FAILED",
            failure_code: "signature_invalid",
            updated_at: new Date().toISOString(),
          };
          statuses.set(submitted.correlation_id, failure);
          return { body: failure };
        }
        let details: Record<string, unknown>;
        if (stored.request.type === "grant_revoke") {
          const grant = grants.find((entry) => entry.grant_id === stored.request.grant_id);
          assert.ok(grant);
          grant.revoked_at = new Date().toISOString();
          details = {
            grant_id: grant.grant_id,
            committed_correlation_ids: [],
            committed_truncated: false,
          };
        } else {
          const grant = {
            grant_id: stored.index.toString(16).padStart(64, "0"),
            agent_id: stored.request.agent_id,
            wallet_id: "wallet-stub",
            label: stored.request.label,
            issued_at: new Date().toISOString(),
            expires_at: stored.request.expires_at,
            revoked_at: null,
            revoked_reason: null,
            owner_epoch: 1,
            owner_message: { label: stored.request.label, credential: stored.request.credential },
          };
          grants.push(grant);
          details = { grant };
        }
        const result = {
          ...existing,
          status: "SUCCESS",
          details,
          updated_at: new Date().toISOString(),
        };
        statuses.set(submitted.correlation_id, result);
        return { body: result };
      },
    },
    {
      match: (url) => url.pathname.endsWith("/grants"),
      respond: () => ({ body: { data: grants } }),
    },
  ];
  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    response.setHeader("content-type", "application/json");
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const raw = Buffer.concat(chunks).toString("utf8");
    const requestBody = raw ? JSON.parse(raw) : null;
    const route = routes.find((candidate) => candidate.match(url, request.method ?? "GET"));
    if (!route) {
      response.statusCode = 404;
      response.end(JSON.stringify({ error: { code: "agent_not_found" } }));
      return;
    }
    const result = route.respond(url, requestBody);
    if (url.pathname.endsWith("/deposit"))
      assert.equal(
        request.headers["x-grant-token"],
        undefined,
        "deposit uses the unscoped API client",
      );
    if (url.pathname === "/v1/submit-intent") {
      submissions++;
      const callback = nextSubmission;
      nextSubmission = null;
      await callback?.();
      if (lostSubmissionResponse) {
        lostSubmissionResponse = false;
        response.statusCode = 503;
        response.end(
          JSON.stringify({
            errors: [{ code: "provider_unavailable", title: "Lost response", status: "503" }],
          }),
        );
        return;
      }
    }
    response.statusCode = result.status ?? 200;
    response.end(JSON.stringify(result.body));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("stub did not bind");
  return {
    url: `http://127.0.0.1:${address.port}`,
    submissions: () => submissions,
    failNextSubmission: () => {
      failedSubmission = true;
    },
    loseNextSubmissionResponse: () => {
      lostSubmissionResponse = true;
    },
    onNextSubmission: (callback: () => Promise<void>) => {
      nextSubmission = callback;
    },
    ownerAgentId: ownAgentId,
    unboundAgentId: unboundOwnAgentId,
    setOwner: (userId: string) => {
      ownerUserId = userId;
    },
    close: () =>
      new Promise((resolve) => {
        server.close(() => resolve());
      }),
  };
}
