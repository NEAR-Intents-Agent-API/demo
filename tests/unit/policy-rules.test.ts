import assert from "node:assert/strict";
import { test } from "node:test";
import { domainKey, policySchema, typedDataDomainSchema } from "@/lib/agent-api/schemas";
import {
  describeNative,
  domainLabel,
  nativeOff,
  parsePrimaryTypes,
} from "../../features/policy/rules/native";
import {
  defaultRules,
  policyFromRules,
  type Rules,
  rulesFromPolicy,
  rulesProblem,
} from "../../features/policy/rules/rules";

const NEAR_ASSET = "nep141:wrap.near";
const USDC = "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1";
const rules = (patch: Partial<Rules> = {}): Rules => ({
  ...structuredClone(defaultRules),
  ...patch,
});

test("a new agent can do everything NEAR Intents offers and send anywhere", () => {
  const policy = policySchema.parse(policyFromRules(null, rules()));
  assert.deepEqual(policy, {
    frozen: false,
    actions: ["swap", "transfer", "withdraw"],
    confidential: true,
    owner_approval: false,
    assets: "any",
    limits: {},
    max_actions_per_hour: null,
    destinations: { mode: "any", list: [] },
    budget: { daily_usd: null, weekly_usd: null, monthly_usd: null },
    timelock_ms: 0,
  });
  assert.deepEqual(rulesFromPolicy(policy), defaultRules);
});

test('"*" is not an asset id: the API refuses it in assets and as a limits key', () => {
  const base = policyFromRules(null, rules());
  assert.equal(policySchema.safeParse({ ...base, assets: ["*"] }).success, false);
  assert.equal(policySchema.safeParse({ ...base, limits: { daily: { "*": "1" } } }).success, false);
  assert.equal(policySchema.safeParse({ ...base, assets: [USDC] }).success, true);
});

test("each ability maps to one policy switch", () => {
  const off = rules({
    abilities: { swap: false, transfer: false, withdraw: false, confidential: false },
  });
  const policy = policyFromRules(null, off);
  assert.deepEqual(policy.actions, []);
  assert.equal(policy.confidential, false);
  assert.deepEqual(rulesFromPolicy(policy).abilities, off.abilities);

  const swapOnly = policyFromRules(
    null,
    rules({ abilities: { ...off.abilities, swap: true, confidential: true } }),
  );
  assert.deepEqual(swapOnly.actions, ["swap"]);
  assert.equal(swapOnly.confidential, true);
});

test("tokens and per-move caps are the policy's assets and limits, with no provider aliases", () => {
  const listed = rules({
    tokens: [NEAR_ASSET, USDC],
    limits: [
      { assetId: NEAR_ASSET, perTransaction: "5000" },
      { assetId: USDC, perTransaction: "10000000" },
    ],
  });
  const policy = policyFromRules(null, listed);
  assert.deepEqual(policy.assets, [NEAR_ASSET, USDC]);
  assert.deepEqual(policy.limits, {
    per_transaction: { [NEAR_ASSET]: "5000", [USDC]: "10000000" },
  });
  const back = rulesFromPolicy(policy);
  assert.deepEqual(back.tokens, [NEAR_ASSET, USDC]);
  assert.deepEqual(back.limits, listed.limits);
});

test("editing caps keeps the buckets the editor does not show; no cap drops the key", () => {
  const current = policyFromRules(null, rules());
  current.limits = { per_transaction: { [USDC]: "1" }, daily: { [NEAR_ASSET]: "1000" } };
  const next = policyFromRules(current, { ...rulesFromPolicy(current), limits: [] });
  assert.deepEqual(next.limits, { daily: { [NEAR_ASSET]: "1000" } });
});

test("hourly cap, budget and approval map straight onto the policy", () => {
  const policy = policyFromRules(
    null,
    rules({
      maxPerHour: "12",
      approval: true,
      budget: { dailyUsd: "25.00", weeklyUsd: "", monthlyUsd: " 300 " },
    }),
  );
  assert.equal(policy.max_actions_per_hour, 12);
  assert.equal(policy.owner_approval, true);
  assert.deepEqual(policy.budget, { daily_usd: "25.00", weekly_usd: null, monthly_usd: "300" });
  const back = rulesFromPolicy(policy);
  assert.equal(back.maxPerHour, "12");
  assert.equal(back.approval, true);
  assert.deepEqual(back.budget, { dailyUsd: "25.00", weeklyUsd: "", monthlyUsd: "300" });
});

test("the delay is typed in seconds and stored in exact milliseconds", () => {
  assert.equal(policyFromRules(null, rules({ delaySeconds: "60" })).timelock_ms, 60_000);
  assert.equal(policyFromRules(null, rules({ delaySeconds: "0.25" })).timelock_ms, 250);
  assert.equal(
    policyFromRules(null, rules({ delaySeconds: "2592000" })).timelock_ms,
    2_592_000_000,
  );
  assert.equal(
    rulesFromPolicy({ ...policyFromRules(null, rules()), timelock_ms: 90_000 }).delaySeconds,
    "90",
  );
  assert.equal(
    rulesFromPolicy({ ...policyFromRules(null, rules()), timelock_ms: 1_500 }).delaySeconds,
    "1.5",
  );
  assert.equal(rulesProblem(rules({ delaySeconds: "2592000" })), null);
  assert.match(rulesProblem(rules({ delaySeconds: "2592001" })) ?? "", /delay/);
  assert.match(rulesProblem(rules({ delaySeconds: "-1" })) ?? "", /delay/);
});

test("destinations are the account's one rule, in the API's own shape", () => {
  assert.deepEqual(
    defaultRules.destinations,
    { mode: "any", list: [] },
    "new accounts send anywhere",
  );
  const only = rules({
    destinations: {
      mode: "only",
      list: [
        { action: "transfer", address: "alice.near", confidential: false },
        { action: "withdraw", chain: "eth", address: `0x${"a".repeat(40)}`, memo: null },
      ],
    },
  });
  const policy = policyFromRules(null, only);
  assert.deepEqual(policy.destinations, only.destinations);
  assert.deepEqual(rulesFromPolicy(policy).destinations, only.destinations);
  policySchema.parse(policy);
  // The private balance works with any destination rule: shield/unshield name no destination.
  assert.equal(rulesProblem(only), null);
  assert.equal(rulesProblem(rules()), null, "an empty list is a valid rule");
  assert.match(
    rulesProblem(rules({ limits: [{ assetId: USDC, perTransaction: "" }] })) ?? "",
    /capped token/,
  );
  assert.match(rulesProblem(rules({ tokens: [] })) ?? "", /token/);
});

test("a schedule round-trips through the policy, and any time omits it", () => {
  const schedule = {
    mode: "only" as const,
    time_zone: "Europe/Berlin",
    windows: [{ days: ["sat" as const, "sun" as const], start: "00:00", end: "24:00" }],
  };
  const policy = policySchema.parse(policyFromRules(null, rules({ schedule })));
  assert.deepEqual(policy.schedule, schedule);
  assert.deepEqual(rulesFromPolicy(policy).schedule, schedule);
  assert.equal("schedule" in policyFromRules(policy, rules({ schedule: null })), false);
});

test("native methods are off by default and omitted until one is switched on", () => {
  assert.equal("native" in policyFromRules(null, rules()), false);
  assert.deepEqual(rulesFromPolicy(policyFromRules(null, rules())).native, nativeOff);
  const native = {
    near: { sign_message: ["login.example.near"], transfer: false, call: [] },
    evm: {
      sign_typed_data: [
        { name: "Exchange", version: "1", chain_id: 1337 },
        {
          name: "HyperliquidSignTransaction",
          version: "1",
          chain_id: 42161,
          verifying_contract: `0x${"0".repeat(40)}`,
          primary_types: ["HyperliquidTransaction:Withdraw"],
        },
      ],
      sign_message: false,
      sign_transaction: false,
    },
    solana: { sign_message: false, sign_transaction: true },
  };
  const policy = policySchema.parse(policyFromRules(null, rules({ native })));
  assert.deepEqual(policy.native, native, "the full block, every key present");
  assert.deepEqual(rulesFromPolicy(policy).native, native);
  const next = policyFromRules(policy, {
    ...rulesFromPolicy(policy),
    budget: { dailyUsd: "50", weeklyUsd: "", monthlyUsd: "" },
  });
  assert.deepEqual(next.native, native, "editing other rules keeps native methods");
  assert.notEqual(next.native, policy.native);
  assert.equal(
    "native" in policyFromRules(policy, { ...rulesFromPolicy(policy), native: nativeOff }),
    false,
    "switching everything off omits the block",
  );
});

test("native sign-in recipients may be domains, and still never the NEAR Intents contracts", () => {
  const domain = { ...nativeOff.near, sign_message: ["App.Example.com"] };
  assert.equal(rulesProblem(rules({ native: { ...nativeOff, near: domain } })), null);
  assert.match(
    rulesProblem(
      rules({
        native: { ...nativeOff, near: { ...nativeOff.near, sign_message: ["INTENTS.near"] } },
      }),
    ) ?? "",
    /intents\.near and intents\.far/,
  );
});

test("native lists never accept the NEAR Intents contracts", () => {
  for (const near of [
    { sign_message: ["intents.near"], transfer: false, call: [] },
    { sign_message: [], transfer: false, call: ["intents.far"] },
  ])
    assert.match(
      rulesProblem(rules({ native: { ...nativeOff, near } })) ?? "",
      /intents\.near and intents\.far/,
    );
  assert.match(
    rulesProblem(
      rules({ native: { ...nativeOff, near: { ...nativeOff.near, call: ["a.near", "a.near"] } } }),
    ) ?? "",
    /unique/,
  );
  assert.equal(
    rulesProblem(
      rules({
        native: { ...nativeOff, near: { ...nativeOff.near, call: ["usdt.tether-token.near"] } },
      }),
    ),
    null,
  );
});

test("a schedule the API would refuse is named before signing", () => {
  const window = { days: ["mon" as const], start: "09:00", end: "17:00" };
  const schedule = { mode: "except" as const, time_zone: "UTC", windows: [window] };
  assert.equal(rulesProblem(rules({ schedule })), null);
  assert.match(
    rulesProblem(rules({ schedule: { ...schedule, windows: [{ ...window, days: [] }] } })) ?? "",
    /at least one day/,
  );
  for (const bad of [
    { ...schedule, windows: [{ ...window, end: "09:00" }] },
    { ...schedule, windows: [{ ...window, start: "" }] },
    { ...schedule, time_zone: "Mars/Olympus" },
  ])
    assert.match(
      rulesProblem(rules({ schedule: bad })) ?? "",
      /start and end/,
      JSON.stringify(bad),
    );
});

test("the native summary names every switch that is on", () => {
  assert.deepEqual(describeNative(nativeOff), []);
  assert.deepEqual(
    describeNative({
      near: { sign_message: ["app.near"], transfer: true, call: ["c.near"] },
      evm: {
        sign_typed_data: [
          { name: "Exchange", chain_id: 1337 },
          { name: "Orders", primary_types: ["Order", "Cancel"] },
        ],
        sign_message: true,
        sign_transaction: true,
      },
      solana: { sign_message: true, sign_transaction: true },
    }),
    [
      "NEAR message signing for app.near",
      "Send NEAR to any account",
      "NEAR calls to c.near",
      "EVM typed data for Exchange (chain 1337): any message type",
      "EVM typed data for Orders: only Order, Cancel",
      "EVM messages",
      "EVM transactions",
      "Solana messages",
      "Solana transactions",
    ],
  );
});

test("a typed data domain may name the message types it admits", () => {
  const domain = { name: "Exchange", chain_id: 1337 };
  assert.deepEqual(typedDataDomainSchema.parse(domain), domain, "absent means any message type");
  const narrowed = { ...domain, primary_types: ["Agent", "HyperliquidTransaction:Withdraw"] };
  assert.deepEqual(typedDataDomainSchema.parse(narrowed), narrowed);
  for (const primary_types of [
    [],
    ["Agent", "Agent"],
    ["EIP712Domain"],
    [""],
    ["T".repeat(257)],
    Array.from({ length: 33 }, (_, index) => `Type${index}`),
  ])
    assert.equal(
      typedDataDomainSchema.safeParse({ ...domain, primary_types }).success,
      false,
      JSON.stringify(primary_types).slice(0, 40),
    );
  assert.equal(
    typedDataDomainSchema.safeParse({
      ...domain,
      primary_types: Array.from({ length: 32 }, (_, index) => `Type${index}`),
    }).success,
    true,
    "32 types is the cap",
  );
  assert.equal(
    typedDataDomainSchema.safeParse({ ...domain, primary_types: ["agent", "Agent"] }).success,
    true,
    "case-sensitive",
  );
  assert.equal(
    typedDataDomainSchema.safeParse({ primary_types: ["Agent"] }).success,
    false,
    "message types alone do not name a domain",
  );
});

test("one domain is one entry whatever message types it names", () => {
  const domain = { name: "Exchange", chain_id: 1337 };
  assert.equal(domainKey({ ...domain, primary_types: ["Agent"] }), domainKey(domain));
  const sameDomain = {
    ...nativeOff,
    evm: {
      ...nativeOff.evm,
      sign_typed_data: [domain, { ...domain, primary_types: ["Agent"] }],
    },
  };
  assert.match(rulesProblem(rules({ native: sameDomain })) ?? "", /domain unique/);
});

test("message types are read one per line or comma separated, once each", () => {
  assert.deepEqual(parsePrimaryTypes(""), []);
  assert.deepEqual(parsePrimaryTypes(" , \n"), []);
  assert.deepEqual(parsePrimaryTypes("Agent, Order\n HyperliquidTransaction:Withdraw ,Agent"), [
    "Agent",
    "Order",
    "HyperliquidTransaction:Withdraw",
  ]);
  assert.deepEqual(parsePrimaryTypes("agent,Agent"), ["agent", "Agent"], "case-sensitive");
});

test("a domain reads with the message types it admits", () => {
  assert.equal(domainLabel({ name: "Exchange" }), "Exchange: any message type");
  assert.equal(
    domainLabel({
      name: "Exchange",
      version: "1",
      chain_id: 1337,
      primary_types: ["Agent"],
    }),
    "Exchange (v1, chain 1337): only Agent",
  );
  assert.equal(
    domainLabel({ chain_id: 1, primary_types: ["A", "B"] }),
    "Unnamed domain (chain 1): only A, B",
  );
});
