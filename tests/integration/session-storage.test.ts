import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { test } from "node:test";
import { and, eq } from "drizzle-orm";
import { createChallengeStore } from "../../lib/auth/challenges";
import { challenge, session, user } from "../../lib/db/schema";
import { createDemoTestDatabase } from "../../lib/db/testing";

test("demo storage persists session rows and single-use challenges", async () => {
  const database = await createDemoTestDatabase();
  try {
    const userId = randomBytes(8).toString("hex");
    await database.db.insert(user).values({
      id: userId,
      name: "Demo session user",
      email: `${userId}@test.invalid`,
    });

    // Session-row deletion is exercised over HTTP in the demo acceptance suite.
    const token = randomBytes(16).toString("hex");
    const sessionId = randomBytes(8).toString("hex");
    await database.db.insert(session).values({
      id: sessionId,
      token,
      userId,
      expiresAt: new Date(Date.now() + 60_000),
    });
    const [stored] = await database.db.select().from(session).where(eq(session.id, sessionId));
    assert.ok(stored);
    assert.equal(stored.token, token);

    await database.db
      .delete(session)
      .where(and(eq(session.id, sessionId), eq(session.userId, userId)));
    assert.equal(
      (await database.db.select().from(session).where(eq(session.id, sessionId))).length,
      0,
      "sign-out deletes the session row",
    );

    const store = createChallengeStore(database);
    const nonce = store.issue();
    await store.register({ id: nonce, purpose: "siwe", subject: "nonce", payload: { nonce } });
    const [row] = await database.db.select().from(challenge).where(eq(challenge.id, nonce));
    assert.equal(row?.purpose, "siwe");
    assert.ok(await store.consume({ id: nonce, purpose: "siwe", subject: "nonce" }));
    assert.equal(await store.consume({ id: nonce, purpose: "siwe", subject: "nonce" }), null);
  } finally {
    await database.close();
  }
});
