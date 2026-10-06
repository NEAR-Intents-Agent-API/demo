import assert from "node:assert/strict";
import { test } from "node:test";
import { sql } from "drizzle-orm";
import { createChallengeStore } from "../../lib/auth/challenges";
import { challenge } from "../../lib/db/schema";
import { createDemoTestDatabase } from "../../lib/db/testing";

test("login challenge is single-use and rejected after expiry", async () => {
  const database = await createDemoTestDatabase();
  try {
    const store = createChallengeStore(database);
    const nonce = store.issue();
    assert.match(nonce, /^[a-z0-9]{16}$/);

    await store.register({
      id: nonce,
      purpose: "siwe",
      subject: "nonce",
      payload: { nonce },
    });
    const consumed = await store.consume({ id: nonce, purpose: "siwe", subject: "nonce" });
    assert.ok(consumed);
    assert.equal(await store.consume({ id: nonce, purpose: "siwe", subject: "nonce" }), null);

    await store.register({
      id: "expired-challenge",
      purpose: "siwe",
      subject: "nonce",
      payload: { nonce: "expired" },
    });
    await database.db
      .update(challenge)
      .set({ expiresAt: sql`now() - interval '1 minute'` })
      .where(sql`${challenge.id} = 'expired-challenge'`);
    assert.equal(
      await store.consume({ id: "expired-challenge", purpose: "siwe", subject: "nonce" }),
      null,
    );
  } finally {
    await database.close();
  }
});

test("binding consent cannot be replayed as a login nonce and vice versa", async () => {
  const database = await createDemoTestDatabase();
  try {
    const store = createChallengeStore(database);
    const nonce = store.issue();
    await store.register({ id: nonce, purpose: "binding", subject: "user:agent", payload: {} });
    assert.equal(await store.consume({ id: nonce, purpose: "siwe", subject: "user:agent" }), null);
    assert.equal(await store.consume({ id: nonce, purpose: "binding", subject: "other" }), null);
    assert.ok(await store.consume({ id: nonce, purpose: "binding", subject: "user:agent" }));
    assert.equal(
      await store.consume({ id: nonce, purpose: "binding", subject: "user:agent" }),
      null,
    );
  } finally {
    await database.close();
  }
});
