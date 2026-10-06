import assert from "node:assert/strict";
import { test } from "node:test";
import { shortId } from "../../components/shared/identifiers";
import { agentRows, ROW_LIMIT } from "../../components/shell/palette-items";

const agent = (id: string, name: string, ownerType?: string) =>
  ({
    id,
    name,
    external_user_id: "user-1",
    deleted: false,
    owner: ownerType ? { type: ownerType } : null,
    owner_account: null,
    wallet: null,
    created_at: new Date().toISOString(),
  }) as never;

test("an agent row opens that agent, never the list", () => {
  const rows = agentRows([agent("a".repeat(64), "customer-42", "evm")]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.path, `/agents/${"a".repeat(64)}`);
  assert.match(rows[0]?.value ?? "", /customer-42/);
  assert.match(rows[0]?.value ?? "", /evm/, "owner type is searchable");
  assert.match(rows[0]?.detail ?? "", /^aaaaaaaa…aaaa$/);
});

test("an unbound agent says so rather than matching an empty owner type", () => {
  const rows = agentRows([agent("b".repeat(64), "fresh")]);
  assert.match(rows[0]?.value ?? "", /unbound/);
});

test("rows are capped so an owner with many agents keeps a usable palette", () => {
  const many = Array.from({ length: ROW_LIMIT + 5 }, (_, index) =>
    agent(String(index).padStart(64, "0"), `agent-${index}`),
  );
  assert.equal(agentRows(many).length, ROW_LIMIT);
});

test("shortId leaves short values intact and elides long ones", () => {
  assert.equal(shortId("abcd"), "abcd");
  assert.equal(shortId("0".repeat(64)), `${"0".repeat(10)}…${"0".repeat(6)}`);
});
