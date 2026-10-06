import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import type {
  AgentApi,
  GenerateIntentResponse,
  GrantView,
  StatusResponse,
} from "@near-intents-agent-api/sdk";
import { eq, sql } from "drizzle-orm";
import {
  forgetClientCredentials,
  heldGrant,
  prepareGrantCredential,
} from "../../lib/agent-api/grant-credentials";
import { createOwnerIntents } from "../../lib/agent-api/intents";
import { demoConfig, parseDemoEnv } from "../../lib/config/env";
import { configureDemoRuntime } from "../../lib/config/runtime";
import {
  grantCredential,
  mcpClientAccess,
  oauthRefreshToken,
  oauthResource,
  user,
} from "../../lib/db/schema";
import { createDemoTestDatabase } from "../../lib/db/testing";
import { listAgentMcpActivity, recordMcpActivity } from "../../lib/mcp/activity";
import {
  activateClient,
  blockClient,
  createClientAccess,
  ensureOAuthClient,
  hashMcpKey,
  listClientAccess,
  verifyClientKey,
} from "../../lib/mcp/clients";
import { agentIdFromResource, agentResourceUrl } from "../../lib/mcp/config";
import { agentResourceExists, ensureAgentResource } from "../../lib/mcp/resources";
import { transferPolicy } from "../support/policies";

process.env.NEAR_INTENTS_AGENT_API_URL = "https://api.example.test";
process.env.NEAR_INTENTS_AGENT_API_KEY = "naa_example_key";
process.env.BETTER_AUTH_SECRET = "test-only-demo-auth-secret-32-chars";
process.env.SECRET_ENCRYPTION_KEY = "test-only-demo-encryption-key-32-chars";
configureDemoRuntime(demoConfig(parseDemoEnv(), "https://demo.example.test"));

test("grant tokens are held per holder and resolve only to their own live grant", async () => {
  const database = await createDemoTestDatabase();
  const userId = randomBytes(8).toString("hex");
  const agentId = randomBytes(32).toString("hex");
  await database.db
    .insert(user)
    .values({ id: userId, name: "Owner", email: `${userId}@test.invalid` });
  const claude = await createClientAccess(
    { userId, name: "claude", agentId, authKind: "api_key" },
    database,
  );
  const cursor = await createClientAccess(
    { userId, name: "cursor", agentId, authKind: "api_key" },
    database,
  );
  try {
    const dashboard = await prepareGrantCredential(
      { userId, agentId, holder: "dashboard", label: "Dashboard" },
      database,
    );
    const forClaude = await prepareGrantCredential(
      { userId, agentId, holder: "mcp", clientAccessId: claude.id, label: "MCP: claude" },
      database,
    );
    await prepareGrantCredential(
      { userId, agentId, holder: "mcp", clientAccessId: cursor.id, label: "MCP: cursor" },
      database,
    );
    const stored = await database.db.select().from(grantCredential);
    assert.equal(stored.length, 3);
    assert.equal(new Set(stored.map((row) => row.commitment)).size, 3);

    const grantFor = (commitment: string, revokedAt: string | null = null) =>
      ({
        grant_id: `grant-${commitment.slice(0, 8)}`,
        revoked_at: revokedAt,
        expires_at: new Date(Date.now() + 60_000).toISOString(),
        owner_message: { credential: commitment },
      }) as unknown as GrantView;
    // The Agent API holds a live grant for the dashboard and for Claude; Cursor's was revoked.
    let grants = [
      grantFor(dashboard.commitment),
      grantFor(forClaude.commitment),
      grantFor(stored.find((row) => row.label === "MCP: cursor")?.commitment ?? "", "revoked"),
    ];
    const tokens: string[] = [];
    const client = {
      listGrants: async () => grants,
      forGrant: (token: string) => {
        tokens.push(token);
        return client;
      },
    } as unknown as AgentApi;

    const claudeGrant = await heldGrant(
      client,
      { userId, agentId, holder: "mcp", clientAccessId: claude.id },
      database,
    );
    assert.equal(claudeGrant?.grant.grant_id, `grant-${forClaude.commitment.slice(0, 8)}`);
    // The unsealed token is exactly the one the owner signed a commitment to.
    assert.equal(
      createHash("sha256")
        .update(tokens[0] ?? "")
        .digest("hex"),
      forClaude.commitment,
    );
    assert.equal(
      stored.some((row) => row.sealedToken.includes(tokens[0] ?? "-")),
      false,
      "tokens are sealed at rest",
    );
    const dashboardGrant = await heldGrant(
      client,
      { userId, agentId, holder: "dashboard" },
      database,
    );
    assert.equal(dashboardGrant?.grant.grant_id, `grant-${dashboard.commitment.slice(0, 8)}`);
    assert.equal(
      await heldGrant(
        client,
        { userId, agentId, holder: "mcp", clientAccessId: cursor.id },
        database,
      ),
      null,
      "a revoked grant is not held",
    );
    assert.equal(
      await heldGrant(client, { userId: "someone-else", agentId, holder: "dashboard" }, database),
      null,
    );

    const replacement = await prepareGrantCredential(
      { userId, agentId, holder: "dashboard", label: "Dashboard" },
      database,
    );
    assert.equal(
      (await heldGrant(client, { userId, agentId, holder: "dashboard" }, database))?.grant.grant_id,
      dashboardGrant?.grant.grant_id,
      "preparing an unsigned replacement must not disable the signed dashboard permission",
    );
    const replacementGrant = grantFor(replacement.commitment);
    grants.unshift(replacementGrant);
    // A still newer preparation is unsigned. Installation order, not preparation order,
    // determines which actual grant is used.
    await prepareGrantCredential(
      { userId, agentId, holder: "dashboard", label: "Dashboard" },
      database,
    );
    assert.equal(
      (await heldGrant(client, { userId, agentId, holder: "dashboard" }, database))?.grant.grant_id,
      replacementGrant.grant_id,
    );
    replacementGrant.revoked_at = new Date().toISOString();
    assert.equal(
      await heldGrant(client, { userId, agentId, holder: "dashboard" }, database),
      null,
      "revoking the selected dashboard grant must not restore an older active grant",
    );
    assert.ok(
      await heldGrant(
        client,
        { userId, agentId, holder: "mcp", clientAccessId: claude.id },
        database,
      ),
      "revoking dashboard access must leave the client's independent permission usable",
    );
    replacementGrant.revoked_at = null;
    replacementGrant.expires_at = new Date(0).toISOString();
    assert.equal(
      await heldGrant(client, { userId, agentId, holder: "dashboard" }, database),
      null,
      "expiration must not restore an older dashboard grant",
    );
    replacementGrant.expires_at = new Date(Date.now() + 60_000).toISOString();

    // Forgetting a connection's tokens closes it without touching the dashboard's grant.
    await forgetClientCredentials(claude.id, database);
    assert.equal(
      await heldGrant(
        client,
        { userId, agentId, holder: "mcp", clientAccessId: claude.id },
        database,
      ),
      null,
    );
    assert.ok(await heldGrant(client, { userId, agentId, holder: "dashboard" }, database));
    grants = [];
    assert.equal(await heldGrant(client, { userId, agentId, holder: "dashboard" }, database), null);
  } finally {
    await database.db.delete(mcpClientAccess).where(eq(mcpClientAccess.userId, userId));
    await database.close();
  }
});

test("shared account resource preserves client isolation, expiry and permanent revocation", async () => {
  const database = await createDemoTestDatabase();
  try {
    const first = await createClientAccess(
      { userId: "owner", agentId: "agent", name: "Codex", authKind: "api_key" },
      database,
    );
    const second = await createClientAccess(
      { userId: "owner", agentId: "agent", name: "OpenClaw", authKind: "api_key" },
      database,
    );
    assert.equal(await verifyClientKey("mcp_unknown", database), null);
    const key = await activateClient(first.id, new Date(Date.now() + 60_000), database);
    const otherKey = await activateClient(second.id, new Date(Date.now() + 60_000), database);
    assert.ok(key && otherKey);
    assert.equal((await verifyClientKey(key, database))?.id, first.id);
    assert.equal((await listClientAccess("other-owner", "agent", database)).length, 0);
    const stored = await database.db.select().from(mcpClientAccess);
    assert.equal(stored.find((row) => row.id === first.id)?.tokenHash, hashMcpKey(key));
    assert.ok(!JSON.stringify(stored).includes(key), "plaintext keys never persisted");
    await blockClient(first, database);
    assert.equal(await verifyClientKey(key, database), null);
    assert.equal((await verifyClientKey(otherKey, database))?.id, second.id);
    await assert.rejects(
      activateClient(first.id, new Date(Date.now() + 60_000), database),
      /client_revoked/,
    );
    await database.db
      .update(mcpClientAccess)
      .set({ expiresAt: new Date(0) })
      .where(eq(mcpClientAccess.id, second.id));
    assert.equal(await verifyClientKey(otherKey, database), null);
    await Promise.all([
      ensureAgentResource("agent", database),
      ensureAgentResource("agent", database),
    ]);
    assert.equal(await agentResourceExists("agent", database), true);
    assert.equal(await agentIdFromResource(await agentResourceUrl("agent")), "agent");
    for (const url of [
      "https://evil.test/api/agents/agent/mcp",
      "https://demo.example.test/api/mcp/old",
      "https://demo.example.test/api/agents/agent/mcp?other=1",
      "https://demo.example.test/api/agents/agent%2Fother/mcp",
    ])
      assert.equal(await agentIdFromResource(url), null);
  } finally {
    await database.close();
  }
});

test("OAuth generations are unique and refresh revocation cannot reach another client or owner", async () => {
  const database = await createDemoTestDatabase();
  try {
    const input = { userId: "owner", agentId: "agent", name: "Codex", oauthClientId: "codex" };
    const [first, same] = await Promise.all([
      ensureOAuthClient(input, database),
      ensureOAuthClient(input, database),
    ]);
    assert.equal(first.id, same.id);
    const resource = await agentResourceUrl("agent");
    await database.db.insert(oauthRefreshToken).values([
      {
        id: "target",
        token: "target",
        userId: "owner",
        clientId: "codex",
        referenceId: first.id,
        resources: [resource],
        scopes: ["agent:full"],
      },
      {
        id: "other-client",
        token: "other-client",
        userId: "owner",
        clientId: "openclaw",
        referenceId: "other",
        resources: [resource],
        scopes: ["agent:full"],
      },
      {
        id: "other-owner",
        token: "other-owner",
        userId: "foreign",
        clientId: "codex",
        referenceId: "other",
        resources: [resource],
        scopes: ["agent:full"],
      },
    ]);
    await blockClient(first, database);
    const tokens = await database.db.select().from(oauthRefreshToken);
    assert.ok(tokens.find((row) => row.id === "target")?.revoked);
    assert.equal(tokens.find((row) => row.id === "other-client")?.revoked, null);
    assert.equal(tokens.find((row) => row.id === "other-owner")?.revoked, null);
    const replacement = await ensureOAuthClient(input, database);
    assert.notEqual(first.id, replacement.id);
    assert.equal(replacement.status, "pending");
    await recordMcpActivity(
      {
        clientAccessId: first.id,
        clientName: "Codex",
        agentId: "agent",
        userId: "owner",
        authKind: "oauth",
        subject: "owner",
        tool: "get_balances",
        status: "ok",
      },
      database,
    );
    assert.equal(
      (await listAgentMcpActivity("owner", "agent", 50, database))[0]?.clientName,
      "Codex",
    );
    assert.equal((await listAgentMcpActivity("foreign", "agent", 50, database)).length, 0);
  } finally {
    await database.close();
  }
});

test("legacy upgrade invalidates MCP access and retains account and attributed history", async () => {
  const directory = await mkdtemp(join(tmpdir(), "demo-legacy-migrations-"));
  await mkdir(join(directory, "meta"));
  const drizzle = fileURLToPath(new URL("../../drizzle", import.meta.url));
  await cp(join(drizzle, "0000_initial_schema.sql"), join(directory, "0000_initial_schema.sql"));
  const journal = JSON.parse(await readFile(join(drizzle, "meta/_journal.json"), "utf8"));
  journal.entries = journal.entries.slice(0, 1);
  await writeFile(join(directory, "meta/_journal.json"), JSON.stringify(journal));
  const database = await createDemoTestDatabase(undefined, { migrationsFolder: directory });
  const execute = async (text: string) => {
    for (const statement of text.split(";").filter((value) => value.trim()))
      await database.db.execute(sql.raw(statement));
  };
  const query = async (text: string) => database.db.execute<Record<string, unknown>>(sql.raw(text));
  try {
    await execute(`INSERT INTO "user" ("id", "name", "email") VALUES ('owner', 'Owner', 'owner@test.invalid');
      INSERT INTO "mcpConnection" ("id", "userId", "name", "agentId") VALUES ('old', 'owner', 'Codex', 'agent');
      INSERT INTO "mcpConnectionKey" ("id", "connectionId", "agentId", "name", "tokenHash", "prefix", "expiresAt") VALUES ('key', 'old', 'agent', 'Key', 'hash', 'mcp_', now() + interval '30 days');
      INSERT INTO "mcpConnectionActivity" ("id", "connectionId", "agentId", "userId", "authKind", "subject", "tool", "status") VALUES ('call', 'old', 'agent', 'owner', 'api_key', 'key', 'get_balances', 'ok');
      INSERT INTO "oauthResource" ("id", "identifier", "name") VALUES ('resource', 'https://demo.example.test/api/mcp/old', 'Legacy');
      INSERT INTO "oauthRefreshToken" ("id", "token", "clientId", "userId", "resources", "scopes") VALUES ('refresh', 'token', 'codex', 'owner', ARRAY['https://demo.example.test/api/mcp/old'], ARRAY['agent:full']);`);
    await database.migrateLatest();
    assert.equal((await query('SELECT "enabled" FROM "mcpConnection"')).rows[0]?.enabled, false);
    assert.ok((await query('SELECT "revokedAt" FROM "mcpConnectionKey"')).rows[0]?.revokedAt);
    assert.ok((await query('SELECT "revoked" FROM "oauthRefreshToken"')).rows[0]?.revoked);
    assert.equal((await query('SELECT "disabled" FROM "oauthResource"')).rows[0]?.disabled, true);
    assert.equal(
      (await query('SELECT "clientName" FROM "mcpActivity"')).rows[0]?.clientName,
      "Codex",
    );
    assert.equal((await query('SELECT "id" FROM "user"')).rows[0]?.id, "owner");
    assert.equal((await query('SELECT "id" FROM "mcpClientAccess"')).rows.length, 0);
  } finally {
    await database.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("successful onboarding retries resource registration without replaying owner proof", async () => {
  const database = await createDemoTestDatabase();
  const owner = {
    type: "near" as const,
    account_id: "owner.near",
    public_key: `ed25519:${"1".repeat(32)}`,
  };
  const intent = {
    standard: "nep413" as const,
    payload: {
      message: "Create account",
      nonce: Buffer.alloc(32).toString("base64"),
      recipient: "api.test",
    },
  };
  const generated: GenerateIntentResponse = {
    correlation_id: crypto.randomUUID(),
    type: "agent_create",
    agent_id: "a".repeat(64),
    status: "PENDING_SIGNATURE",
    signer: owner,
    intent,
    preview: { summary: "Create account" },
    expires_at: new Date(Date.now() + 60_000).toISOString(),
  };
  let submissions = 0;
  let registrationFailure = true;
  const status = () =>
    ({
      correlation_id: generated.correlation_id,
      type: "agent_create",
      agent_id: generated.agent_id,
      status: submissions ? "SUCCESS" : "PENDING_SIGNATURE",
      failure_code: null,
      details: {},
      created_at: "",
      updated_at: "",
    }) as StatusResponse;
  const api = {
    generateIntent: async () => generated,
    getStatus: async () => status(),
    submitIntent: async () => {
      submissions++;
      return status();
    },
  } as unknown as AgentApi;
  const intercepted = new Proxy(database.db, {
    get(target, property, receiver) {
      if (property === "insert")
        return (table: Parameters<typeof target.insert>[0]) => {
          if (table === oauthResource && registrationFailure) {
            registrationFailure = false;
            throw new Error("resource_registration_unavailable");
          }
          return target.insert(table);
        };
      return Reflect.get(target, property, receiver);
    },
  });
  const service = createOwnerIntents({ ...database, db: intercepted }, api);
  try {
    await database.db
      .insert(user)
      .values({ id: "owner", name: "Owner", email: "owner@test.invalid" });
    await service.generate("owner", {
      type: "agent_create",
      name: "Account",
      owner,
      policy: transferPolicy({ recipient: "recipient.near" }),
    });
    await assert.rejects(
      service.submit("owner", generated.agent_id, generated.correlation_id, {
        ...intent,
        public_key: owner.public_key,
        signature: "a".repeat(128),
      }),
      /resource_registration_unavailable/,
    );
    assert.equal(submissions, 1);
    assert.equal(await agentResourceExists(generated.agent_id, database), false);
    assert.equal(
      (await service.latest("owner", generated.agent_id, "agent_create"))?.operation.status,
      "SUCCESS",
    );
    await service.latest("owner", generated.agent_id, "agent_create");
    assert.equal(submissions, 1);
    assert.equal((await database.db.select().from(oauthResource)).length, 1);
    assert.equal(await agentResourceExists(generated.agent_id, database), true);
  } finally {
    await database.close();
  }
});
