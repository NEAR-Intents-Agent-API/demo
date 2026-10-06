import assert from "node:assert/strict";
import { test } from "node:test";
import {
  agentFundsUrl,
  agentSetupUrl,
  agentTabUrl,
  allowedSetupStep,
  allowedTab,
} from "../../features/agents/model/tabs";
import { loginReturnTo, pendingAuthorizationUrl } from "../../features/auth/utils";

test("tab navigation preserves other search state and produces reloadable links", () => {
  const path = agentTabUrl("/agents/alice", "client_id=cli&tab=wallet&filter=pending", "rules");
  assert.equal(path, "/agents/alice?client_id=cli&tab=rules&filter=pending");
  assert.equal(allowedTab(new URL(path, "https://demo.test").searchParams.get("tab")), "rules");
  assert.equal(allowedTab("connect"), "rules");
  assert.equal(allowedTab("unrecognized"), "rules");
  assert.equal(allowedTab("wallet"), "rules");
  assert.equal(allowedTab(null), "rules");
  assert.equal(allowedTab(undefined), "rules");
  assert.equal(allowedTab("activity"), "activity");
});

test("funds dialog preserves the account tab and request context", () => {
  const base = "/agents/sample";
  const opened = new URL(
    agentTabUrl(base, "tab=rules&setup=access&filter=pending", "funds"),
    "https://example.test",
  );
  assert.equal(opened.searchParams.get("tab"), "rules");
  assert.equal(opened.searchParams.get("funds"), "1");
  assert.equal(opened.searchParams.has("setup"), false);
  assert.equal(opened.searchParams.get("filter"), "pending");
  const closed = new URL(agentFundsUrl(base, opened.search, false), opened.origin);
  assert.equal(closed.searchParams.get("tab"), "rules");
  assert.equal(closed.searchParams.has("funds"), false);
  assert.equal(closed.searchParams.get("filter"), "pending");
  const setup = new URL(agentSetupUrl(base, opened.search, "access"), opened.origin);
  assert.equal(setup.searchParams.get("tab"), "rules");
  assert.equal(setup.searchParams.has("funds"), false);
  const activity = new URL(agentTabUrl(base, opened.search, "activity"), opened.origin);
  assert.equal(activity.searchParams.has("funds"), false);
});

test("legacy funds links return to rules when their dialog closes", () => {
  const closed = new URL(
    agentFundsUrl("/agents/sample", "tab=funds&filter=pending", false),
    "https://example.test",
  );
  assert.equal(closed.searchParams.get("tab"), "rules");
  assert.equal(closed.searchParams.get("filter"), "pending");
});

test("login defaults to the guide, keeps dashboard destinations and refuses unsafe redirects", () => {
  assert.equal(loginReturnTo("/how-it-works"), "/how-it-works");
  assert.equal(loginReturnTo("/agents/alice?tab=connect"), "/agents/alice?tab=connect");
  for (const value of [
    "https://evil.test",
    "//evil.test",
    "//[",
    "/\\evil.test",
    "/api/auth/sign-out",
    "/agents/../../api/auth",
    "/agents\n",
    "/how-it-works/../../api/auth",
    "/how-it-works-extra",
    ["/agents"],
    undefined,
  ]) {
    assert.equal(loginReturnTo(value), "/how-it-works");
  }
});

test("setup steps retain request context; leaving setup clears the selected step", () => {
  const base = "/agents/sample";
  const initial = "client_id=sample-client&scope=read&scope=write&setup=live&tab=wallet";
  const funding = new URL(agentSetupUrl(base, initial, "fund"), "https://example.test");
  assert.equal(funding.searchParams.get("setup"), "fund");
  assert.deepEqual(funding.searchParams.getAll("scope"), ["read", "write"]);
  const access = new URL(agentSetupUrl(base, funding.search, "access"), funding.origin);
  assert.equal(access.pathname, base);
  assert.equal(access.searchParams.get("setup"), "access");
  const connect = new URL(agentSetupUrl(base, access.search, "connect"), access.origin);
  assert.equal(connect.pathname, base);
  assert.equal(connect.searchParams.get("tab"), "rules");
  assert.equal(connect.searchParams.get("setup"), "connect");
  assert.equal(connect.searchParams.get("client_id"), "sample-client");
  assert.deepEqual(connect.searchParams.getAll("scope"), ["read", "write"]);
  const account = new URL(agentTabUrl(base, connect.search, "activity"), connect.origin);
  assert.equal(account.searchParams.has("setup"), false);
  assert.equal(account.searchParams.get("client_id"), "sample-client");
});

test("setup dialogs preserve the account tab and ignore unknown steps", () => {
  const base = "/agents/sample";
  const url = new URL(
    agentSetupUrl(base, "tab=activity&filter=pending", "access"),
    "https://example.test",
  );
  assert.equal(url.pathname, base);
  assert.equal(url.searchParams.get("tab"), "activity");
  assert.equal(url.searchParams.get("filter"), "pending");
  assert.equal(allowedSetupStep(url.searchParams.get("setup")), "access");
  assert.equal(allowedSetupStep("unknown"), null);
  assert.equal(allowedSetupStep(null), null);
  const closed = new URL(agentTabUrl(base, url.search, "activity"), url.origin);
  assert.equal(closed.searchParams.has("setup"), false);
  assert.equal(closed.searchParams.get("tab"), "activity");
});

test("an existing login can resume an OAuth request without losing repeated scopes", () => {
  const url = pendingAuthorizationUrl(
    "sig=signed&client_id=cli&scope=read&scope=write&state=opaque&exp=99",
  );
  assert.equal(url, "/api/auth/oauth2/authorize?client_id=cli&scope=read&scope=write&state=opaque");
  assert.equal(pendingAuthorizationUrl("client_id=cli"), null);
});
