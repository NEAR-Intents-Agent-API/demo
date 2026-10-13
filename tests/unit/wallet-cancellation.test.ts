import assert from "node:assert/strict";
import { test } from "node:test";
import { isWalletCancellation } from "../../features/wallet/cancellation";
import { errorMessage } from "../../lib/http/messages";

function named(name: string, message = "x", extra: object = {}) {
  return Object.assign(new Error(message), { name }, extra);
}

test("wallet and passkey dismissals are recognised by name, code or message", () => {
  assert.ok(isWalletCancellation(new Error("User rejected")));
  assert.ok(isWalletCancellation(new Error("User closed the window")));
  assert.ok(isWalletCancellation(new Error("The signing request was cancelled")));
  assert.ok(isWalletCancellation(named("UserRejectedRequestError", "User rejected the request.")));
  assert.ok(isWalletCancellation(Object.assign(new Error("denied"), { code: 4001 })));
  assert.ok(isWalletCancellation(named("NotAllowedError", "The operation either timed out")));
  assert.ok(isWalletCancellation(named("AbortError", "The operation was aborted.")));
  assert.ok(
    isWalletCancellation(Object.assign(new Error("x"), { code: "ERROR_CEREMONY_ABORTED" })),
  );
});

test("a wrapped dismissal is found along the cause chain", () => {
  const inner = named("UserRejectedRequestError");
  assert.ok(isWalletCancellation(new Error("Wallet failed", { cause: inner })));
});

test("real failures are not mistaken for cancellations", () => {
  assert.equal(isWalletCancellation(new Error("owner_account_mismatch")), false);
  assert.equal(isWalletCancellation(new Error("wallet_signature_missing")), false);
  assert.equal(isWalletCancellation(new Error("Insufficient funds for gas")), false);
  assert.equal(isWalletCancellation(null), false);
  assert.equal(isWalletCancellation("User rejected"), false);
});

test("the cancellation code reads as one calm message", () => {
  assert.equal(
    errorMessage("wallet_request_cancelled"),
    "Wallet request cancelled. Try again when you are ready.",
  );
});
