import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canonicalChainId,
  chainInfo,
  chainOfAsset,
  compareChains,
  knownChains,
} from "../../features/assets/chains";
import { tokenLogoUrl } from "../../features/assets/tokens";

test("chain aliases fold onto the canonical id", () => {
  assert.equal(canonicalChainId("Ethereum"), "eth");
  assert.equal(canonicalChainId("arbitrum"), "arb");
  assert.equal(canonicalChainId("sol"), "sol");
});

test("an unknown chain renders as its own id with no artwork", () => {
  const info = chainInfo("newchain");
  assert.equal(info.name, "NEWCHAIN");
  assert.equal(info.logo, null);
});

test("every catalogued chain with local artwork points inside /assets/chains", () => {
  for (const chain of knownChains()) {
    assert.ok(
      chain.logo === null ||
        chain.logo.startsWith("/assets/chains/") ||
        chain.logo.startsWith("https://"),
      chain.id,
    );
  }
});

test("NEAR and the main funding routes sort first", () => {
  const order = ["sol", "near", "zec", "eth"].sort(compareChains);
  assert.deepEqual(order, ["near", "eth", "sol", "zec"]);
});

test("the chain of an asset is read from its id", () => {
  assert.equal(
    chainOfAsset("nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near"),
    "eth",
  );
  assert.equal(
    chainOfAsset("nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near"),
    "base",
  );
  assert.equal(chainOfAsset("nep141:btc.omft.near"), "btc");
  assert.equal(chainOfAsset("nep141:sol.omft.near"), "sol");
  assert.equal(chainOfAsset("1cs_v1:starknet:erc20:0x05ce"), "starknet");
  assert.equal(chainOfAsset("nep245:v2_1.omni.hot.tg:10_vLAiSt9KfUGKpw5cD3vsSyNYBn5"), "op");
  assert.equal(chainOfAsset("nep141:wrap.near"), "near");
});

test("token art resolves by asset id, then symbol, else nothing", () => {
  assert.match(tokenLogoUrl("nep141:btc.omft.near", "BTC") ?? "", /coins\/128x128\/1\.png$/);
  assert.match(tokenLogoUrl("nep141:unknown.near", "usdc") ?? "", /3408\.png$/);
  assert.match(tokenLogoUrl(null, "WSOL") ?? "", /5426\.png$/);
  assert.equal(tokenLogoUrl("nep141:unknown.near", "ZZZTOKEN"), null);
});
