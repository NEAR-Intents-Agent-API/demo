import assert from "node:assert/strict";
import test from "node:test";
import { destinationFromDraft } from "../../features/funds/access/destination-utils";
import {
  isNearAccountId,
  transferRecipientProblem,
  withdrawalAddressProblem,
} from "../../lib/agent-api/address";
import { canonicalDestination } from "../../lib/agent-api/schemas";

const valid: Record<string, string[]> = {
  sol: [
    "11111111111111111111111111111111",
    "So11111111111111111111111111111111111111112",
    "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  ],
  btc: [
    "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2",
    "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy",
    "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
    "bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0",
  ],
  xrp: ["rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"],
  stellar: ["GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7"],
  ton: [
    "EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N",
    "0:83dfd552e63729b472fcbcc8c45ebcc6691702558b68ec7527e1ba403a0f31a8",
  ],
  tron: ["TQrY8tryqsYVCYS3MFbtffiPp2ccyn4STm", "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7"],
  base: ["0x52908400098527886e0f7030069857d2e4169ee7"],
  near: ["alice.near", "bob.tg", "a1", "a-b_c.d.near", "ab".repeat(32)],
};

const invalid: Record<string, string[]> = {
  sol: [
    "",
    "not-an-address",
    "1111111111111111111111111111111",
    "0OIl0OIl0OIl0OIl0OIl0OIl0OIl0OIl",
  ],
  btc: [
    "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN3",
    "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdr",
    "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
    "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5MDq",
    "0x52908400098527886e0f7030069857d2e4169ee7",
  ],
  xrp: ["rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTi", "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2"],
  stellar: [
    "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN6",
    "SAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7",
    "GAAZI4",
  ],
  ton: [
    "EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2M",
    "0:83dfd552e63729b472fcbcc8c45ebcc6691702558b68ec7527e1ba403a0f31",
    "7:83dfd552e63729b472fcbcc8c45ebcc6691702558b68ec7527e1ba403a0f31a8",
  ],
  tron: ["TQrY8tryqsYVCYS3MFbtffiPp2ccyn4STn", "0x52908400098527886e0f7030069857d2e4169ee7"],
  base: [
    "0x5290",
    "52908400098527886e0f7030069857d2e4169ee7",
    "0xZZ908400098527886e0f7030069857d2e4169ee7",
  ],
  near: [
    "",
    "a",
    "Alice.near",
    ".near",
    "alice..near",
    "alice.near.",
    "-alice.near",
    "al ice",
    "x".repeat(65),
  ],
};

for (const [chain, addresses] of Object.entries(valid))
  test(`${chain} accepts well-formed addresses`, () => {
    for (const address of addresses)
      assert.equal(withdrawalAddressProblem(chain, address), null, address);
  });

for (const [chain, addresses] of Object.entries(invalid))
  test(`${chain} refuses malformed addresses with a reason`, () => {
    for (const address of addresses)
      assert.match(withdrawalAddressProblem(chain, address) ?? "", /^Not a valid/, address);
  });

test("the reason names the network", () => {
  assert.equal(withdrawalAddressProblem("sol", "abc"), "Not a valid Solana address");
  assert.equal(withdrawalAddressProblem("btc", "abc"), "Not a valid Bitcoin address");
  assert.equal(withdrawalAddressProblem("xrp", "abc"), "Not a valid XRP address");
  assert.equal(withdrawalAddressProblem("stellar", "abc"), "Not a valid Stellar address");
  assert.equal(withdrawalAddressProblem("ton", "abc"), "Not a valid TON address");
  assert.equal(withdrawalAddressProblem("tron", "abc"), "Not a valid Tron address");
});

test("networks without a checker pass for the API to judge", () => {
  assert.equal(withdrawalAddressProblem("doge", "anything at all"), null);
  assert.equal(withdrawalAddressProblem("some-new-chain", "x"), null);
});

test("transfer recipients are NEAR accounts", () => {
  assert.equal(transferRecipientProblem("alice.near"), null);
  assert.equal(transferRecipientProblem("not an account"), "Not a valid NEAR account");
  assert.equal(isNearAccountId("a".repeat(64)), true);
  assert.equal(isNearAccountId("a".repeat(63).concat("g")), true);
});

test("destinations canonicalise EVM addresses to lowercase and refuse bad ones", () => {
  const destination = canonicalDestination({
    action: "withdraw",
    chain: "base",
    address: "0x52908400098527886E0F7030069857D2E4169EE7",
    memo: null,
  });
  assert.equal(destination.address, "0x52908400098527886e0f7030069857d2e4169ee7");
  assert.throws(() =>
    canonicalDestination({ action: "withdraw", chain: "sol", address: "nope", memo: null }),
  );
  assert.throws(() =>
    canonicalDestination({ action: "transfer", address: "Not Valid", confidential: false }),
  );
});

const draft = { action: "withdraw", chain: "sol", address: "", memo: "", hasMemo: false } as const;

test("a draft destination says what is wrong with it", () => {
  assert.throws(() => destinationFromDraft({ ...draft, chain: "" }), /Choose a network/);
  assert.throws(() => destinationFromDraft(draft), /Enter a recipient address/);
  assert.throws(
    () => destinationFromDraft({ ...draft, address: "nope" }),
    /Not a valid Solana address/,
  );
  assert.throws(
    () =>
      destinationFromDraft({
        ...draft,
        address: "11111111111111111111111111111111",
        hasMemo: true,
      }),
    /Enter the memo/,
  );
  assert.throws(
    () =>
      destinationFromDraft({
        ...draft,
        address: "11111111111111111111111111111111",
        hasMemo: true,
        memo: "m".repeat(257),
      }),
    /Memo is at most 256 characters/,
  );
  assert.throws(
    () => destinationFromDraft({ ...draft, action: "intents_transfer", address: "No Way" }),
    /Not a valid NEAR account/,
  );
});

test("a draft destination trims the pasted address", () => {
  assert.deepEqual(
    destinationFromDraft({ ...draft, address: " 11111111111111111111111111111111 " }),
    {
      action: "withdraw",
      chain: "sol",
      address: "11111111111111111111111111111111",
      memo: null,
    },
  );
});
