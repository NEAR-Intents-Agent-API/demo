import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  approvalVotes,
  describeVoter,
} from "../../features/wallet/approvals/approval-display-utils";
import { ApprovalVotes } from "../../features/wallet/approvals/approval-votes";

test("an approval's votes are read when the API sends them and ignored when it does not", () => {
  const vote = { voter: "passkey:alice.near", verdict: "reject", voted_at: "2026-11-17T10:00:00Z" };
  assert.deepEqual(approvalVotes({ votes: [vote] }), [vote]);
  assert.deepEqual(approvalVotes({}), []);
  assert.deepEqual(approvalVotes({ votes: "none" }), []);
  assert.deepEqual(
    approvalVotes({ votes: [{ voter: "evm:0xabc", verdict: "maybe", voted_at: "x" }, null, vote] }),
    [vote],
  );
});

test("a voter reads as its account and how it signed, without a NEAR key", () => {
  assert.deepEqual(describeVoter("near:alice.near:ed25519:6E8bAbc"), {
    account: "alice.near",
    method: "NEAR wallet",
  });
  assert.deepEqual(describeVoter("evm:0x1234"), { account: "0x1234", method: "EVM wallet" });
  assert.deepEqual(describeVoter("passkey:bob.near"), { account: "bob.near", method: "passkey" });
});

test("a recorded vote describes the signed submission", () => {
  const markup = renderToStaticMarkup(
    createElement(ApprovalVotes, {
      votes: [
        { voter: "passkey:alice.near", verdict: "approve", voted_at: "2026-11-17T10:00:00Z" },
        { voter: "passkey:bob.near", verdict: "reject", voted_at: "2026-11-17T10:00:01Z" },
      ],
    }),
  );
  assert.match(markup, />Recorded vote to approve<\/span><span>from<\/span>/);
  assert.match(markup, />Recorded vote to reject<\/span><span>from<\/span>/);
});
