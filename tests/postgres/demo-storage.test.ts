import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { eq, sql } from "drizzle-orm";
import { createChallengeStore } from "../../lib/auth/challenges";
import { createDemoDatabase } from "../../lib/db/client";
import { challenge, session, user } from "../../lib/db/schema";
import { requireTestEnv } from "../support/env.js";

const open = () => createDemoDatabase(requireTestEnv("TEST_DEMO_DATABASE_URL"));

async function insertUser(database: ReturnType<typeof open>): Promise<string> {
  const id = randomUUID();
  await database.db.insert(user).values({ id, name: "demo-pg", email: `${id}@test.invalid` });
  return id;
}

test("demo PostgreSQL has the demo migration applied", async () => {
  const database = open();
  try {
    await database.checkConnection();
    const { rows } = await database.db.execute<{ table_name: string }>(
      sql`select table_name from information_schema.tables where table_schema = 'public'`,
    );
    const tables = new Set(rows.map((row) => row.table_name));
    for (const name of [
      "user",
      "session",
      "challenge",
      "passkey",
      "mcpClientAccess",
      "mcpActivity",
      "demo_owner_intent",
    ])
      assert.ok(tables.has(name), `table ${name} exists; run pnpm demo:db:migrate`);
  } finally {
    await database.close();
  }
});

test("demo PostgreSQL enforces session token uniqueness and user references", async () => {
  const database = open();
  try {
    const userId = await insertUser(database);
    const token = randomUUID();
    const row = { userId, token, expiresAt: new Date(Date.now() + 60_000) };
    await database.db.insert(session).values({ id: randomUUID(), ...row });
    await assert.rejects(database.db.insert(session).values({ id: randomUUID(), ...row }));
    await assert.rejects(
      database.db
        .insert(session)
        .values({ id: randomUUID(), ...row, token: randomUUID(), userId: randomUUID() }),
    );
    const stored = await database.db.select().from(session).where(eq(session.token, token));
    assert.equal(stored.length, 1);
  } finally {
    await database.close();
  }
});

test("a challenge is consumed by exactly one of many concurrent connections", async () => {
  const database = open();
  try {
    const store = createChallengeStore(database);
    const id = randomUUID();
    await store.register({ id, purpose: "siwe", subject: "nonce", payload: { id } });
    const results = await Promise.all(
      Array.from({ length: 16 }, () => store.consume({ id, purpose: "siwe", subject: "nonce" })),
    );
    assert.equal(results.filter((result) => result !== null).length, 1);
    assert.deepEqual(await database.db.select().from(challenge).where(eq(challenge.id, id)), []);
  } finally {
    await database.close();
  }
});

test("a challenge is not consumable for another purpose, another subject or after expiry", async () => {
  const database = open();
  try {
    const store = createChallengeStore(database);
    const id = randomUUID();
    await store.register({ id, purpose: "grant", subject: "u:c", payload: {} });
    assert.equal(await store.consume({ id, purpose: "approval", subject: "u:c" }), null);
    assert.equal(await store.consume({ id, purpose: "grant", subject: "other:c" }), null);

    await database.db
      .update(challenge)
      .set({ expiresAt: new Date(Date.now() - 1_000) })
      .where(eq(challenge.id, id));
    assert.equal(await store.consume({ id, purpose: "grant", subject: "u:c" }), null);
    await database.db.delete(challenge).where(eq(challenge.id, id));
  } finally {
    await database.close();
  }
});
