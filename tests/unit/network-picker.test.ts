import assert from "node:assert/strict";
import { test } from "node:test";
import { filterNetworks } from "../../features/assets/picker-utils.js";

test("network search accepts names, tickers and aliases without changing route IDs", () => {
  const routes = ["near", "eth", "arb", "sol"];
  assert.deepEqual(filterNetworks(routes, "  ETHEREUM "), ["eth"]);
  assert.deepEqual(filterNetworks(routes, "arbitrum"), ["arb"]);
  assert.deepEqual(filterNetworks(routes, "SOL"), ["sol"]);
  assert.deepEqual(filterNetworks(routes, ""), routes);
});

test("network search never offers routes outside the form's allowed list", () => {
  assert.deepEqual(filterNetworks(["near", "sol"], "ethereum"), []);
  assert.deepEqual(filterNetworks(["eth", "base"], "unknown"), []);
  assert.deepEqual(filterNetworks([], ""), []);
});
