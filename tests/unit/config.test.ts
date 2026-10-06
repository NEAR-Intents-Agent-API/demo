import assert from "node:assert/strict";
import { test } from "node:test";
import { demoConfig, parseDemoEnv } from "../../lib/config/env";

const settings = {
  NODE_ENV: "test",
  NEAR_INTENTS_AGENT_API_URL: "https://api.example.test",
  NEAR_INTENTS_AGENT_API_KEY: "naa_example_key",
  BETTER_AUTH_SECRET: "test-only-demo-auth-secret-32-chars",
  SECRET_ENCRYPTION_KEY: "test-only-demo-encryption-key-32-chars",
};

test("demo origin scopes auth, passkeys and MCP; encryption stays independent of API credentials", () => {
  const config = demoConfig(parseDemoEnv(settings), "https://demo.example.test/");
  assert.equal(config.PASSKEY_RP_ID, "demo.example.test");
  assert.equal(config.MCP_ORIGIN, config.PASSKEY_ORIGIN);
  assert.equal(config.BETTER_AUTH_URL, "https://demo.example.test");
  assert.notEqual(config.BETTER_AUTH_SECRET, settings.NEAR_INTENTS_AGENT_API_KEY);
  assert.equal(
    config.BETTER_AUTH_SECRET,
    demoConfig(settings, config.BETTER_AUTH_URL).BETTER_AUTH_SECRET,
  );
  assert.equal(
    config.BETTER_AUTH_SECRET,
    demoConfig(settings, "https://other.example.test").BETTER_AUTH_SECRET,
  );
  assert.equal(
    config.BETTER_AUTH_SECRET,
    demoConfig(
      { ...settings, NEAR_INTENTS_AGENT_API_URL: "https://other-api.example.test" },
      config.BETTER_AUTH_URL,
    ).BETTER_AUTH_SECRET,
  );
  assert.equal(
    config.BETTER_AUTH_SECRET,
    demoConfig(
      { ...settings, NEAR_INTENTS_AGENT_API_KEY: "replacement_key" },
      config.BETTER_AUTH_URL,
    ).BETTER_AUTH_SECRET,
  );
  assert.notEqual(
    config.BETTER_AUTH_SECRET,
    demoConfig(
      { ...settings, BETTER_AUTH_SECRET: "replacement-demo-auth-secret-32-chars" },
      config.BETTER_AUTH_URL,
    ).BETTER_AUTH_SECRET,
  );
});

test("reject missing credentials and remote plaintext; allow local development", () => {
  assert.throws(
    () => parseDemoEnv({ ...settings, NEAR_INTENTS_AGENT_API_KEY: "" }),
    /NEAR_INTENTS_AGENT_API_KEY/,
  );
  for (const secret of [undefined, "", "YOUR_SECRET_ENCRYPTION_KEY", "x".repeat(65)]) {
    assert.throws(
      () => parseDemoEnv({ ...settings, SECRET_ENCRYPTION_KEY: secret }),
      /SECRET_ENCRYPTION_KEY/,
    );
  }
  for (const secret of [undefined, "", "YOUR_BETTER_AUTH_SECRET", "x".repeat(65)]) {
    assert.throws(
      () => parseDemoEnv({ ...settings, BETTER_AUTH_SECRET: secret }),
      /BETTER_AUTH_SECRET/,
    );
  }
  for (const url of [
    "http://api.example.test",
    "https://user:secret@api.example.test",
    "https://api.example.test?key=secret",
  ]) {
    assert.throws(
      () => parseDemoEnv({ ...settings, NEAR_INTENTS_AGENT_API_URL: url }),
      /HTTPS API URL required/,
    );
  }
  assert.throws(
    () => demoConfig(settings, "http://demo.example.test"),
    /HTTPS demo origin required/,
  );
  assert.equal(
    demoConfig(
      parseDemoEnv({ ...settings, NEAR_INTENTS_AGENT_API_URL: "http://localhost:3000" }),
      "http://localhost:3001",
    ).PASSKEY_RP_ID,
    "localhost",
  );
});
