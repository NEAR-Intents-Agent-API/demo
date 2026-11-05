import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OnboardingPanel } from "../../features/agents/agent-detail/components/onboarding-panel";
import { OwnerRiskNotice } from "../../features/wallet/components/owner-risk-notice";

const notice =
  "This is an experimental, mainnet-only beta service. You may lose all assets you put in this wallet, or lose access to them. Keep amounts small.";

function onboardingMarkup(status: string) {
  const step = {
    generated: { expires_at: new Date(Date.now() + 60_000).toISOString(), preview: {} },
    operation: { status },
  };
  const view = {
    onboarding: { isPending: false, error: null, data: step },
    finish: { isPending: false, error: null },
    restart: { isPending: false, error: null },
    stage: "",
  };
  return renderToStaticMarkup(createElement(OnboardingPanel, { view: view as never }));
}

test("the required risk notice is shown word for word", () => {
  assert.ok(renderToStaticMarkup(createElement(OwnerRiskNotice)).includes(notice));
});

test("an owner sees the notice while the request can be signed, and not once it is live", () => {
  assert.ok(onboardingMarkup("PENDING_SIGNATURE").includes(notice));
  assert.ok(!onboardingMarkup("SUCCESS").includes(notice));
});

test("the deposit flow shows the notice before any funding route", () => {
  const flow = readFileSync("features/funds/deposit/deposit-flow.tsx", "utf8");
  const shown = flow.indexOf("<OwnerRiskNotice />");
  assert.ok(shown !== -1 && shown < flow.indexOf("<DepositSourceDropdown"));
});
