import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorkloadKey, jwkThumbprintUri } from "@near-intents-agent-api/sdk";
import {
  buildKeyCredential,
  buildOidcCredential,
  claimDraft,
  type OidcDraft,
  pastedKeyThumbprint,
} from "../../features/funds/access/workload-grant-form-utils";
import { workloadCredentialSchema } from "../../lib/agent-api/schemas";
import { knownErrorCode } from "../../lib/http/errors";

const github = (patch: Partial<OidcDraft> = {}): OidcDraft => ({
  preset: "github",
  issuer: "",
  audience: "",
  claims: [
    claimDraft("repository_owner_id", "42"),
    claimDraft("repository_id", "7"),
    claimDraft("environment", "production"),
  ],
  jwks: "",
  ...patch,
});

test("a GitHub preset signs its fixed issuer and the pinned claims, with no audience", () => {
  const built = buildOidcCredential(github({ issuer: "https://typed.example" }));
  assert.deepEqual(built.credential, {
    type: "oidc",
    issuer: "https://token.actions.githubusercontent.com",
    claims: { repository_owner_id: "42", repository_id: "7", environment: "production" },
  });
});

test("only Microsoft Entra ID names an audience; it is required there", () => {
  const entra = (audience: string): OidcDraft => ({
    preset: "entra",
    issuer: "https://sts.windows.net/tenant-1/",
    audience,
    claims: [claimDraft("oid", "obj-1"), claimDraft("idtyp", "app")],
    jwks: "",
  });
  assert.equal(buildOidcCredential(entra("api://near-intents-agents")).credential?.type, "oidc");
  assert.deepEqual(buildOidcCredential(entra("api://near-intents-agents")).credential, {
    type: "oidc",
    issuer: "https://sts.windows.net/tenant-1/",
    audience: "api://near-intents-agents",
    claims: { oid: "obj-1", idtyp: "app" },
  });
  assert.match(buildOidcCredential(entra("  ")).problems?.audience ?? "", /audience/i);
  // The tenant placeholder is not an issuer.
  assert.ok(
    buildOidcCredential({ ...entra("a"), issuer: "https://sts.windows.net/<tenant>/" }).problems
      ?.issuer,
  );
  // An audience typed for another preset is dropped, never sent.
  const typed = buildOidcCredential(github({ audience: "https://other.example" }));
  assert.equal(typed.credential?.type === "oidc" && typed.credential.audience, undefined);
});

test("claims need names and values, once each, at most 16, and no registered claim", () => {
  const claims = (...rows: [string, string][]) =>
    buildOidcCredential(github({ claims: rows.map(([name, value]) => claimDraft(name, value)) }));
  assert.match(claims().problems?.claims ?? "", /at least one/);
  assert.match(claims(["repository_id", ""]).problems?.claims ?? "", /name and a value/);
  assert.match(claims(["sub", "a"], ["sub", "b"]).problems?.claims ?? "", /once/);
  assert.match(claims(["aud", "x"]).problems?.claims ?? "", /cannot be pinned/);
  assert.match(
    claims(...Array.from({ length: 17 }, (_, i): [string, string] => [`c${i}`, "v"])).problems
      ?.claims ?? "",
    /at most 16/,
  );
  assert.equal(claims(["/kubernetes.io/serviceaccount/uid", "u-1"]).credential?.type, "oidc");
  // A pointer into a registered claim or a prototype member fails here, not as a late 400.
  for (const name of [
    "/iss",
    "/aud/x",
    "/a/__proto__",
    "/constructor",
    "/a/b/prototype",
    "__proto__",
  ])
    assert.match(claims([name, "x"]).problems?.claims ?? "", /cannot be pinned/, name);
  assert.equal(claims(["/issuer/x", "v"]).credential?.type, "oidc");
  // Rows left completely empty are not claims.
  assert.equal(claims(["sub", "x"], ["", ""]).credential?.type, "oidc");
});

test("a custom issuer may sign its keys; a private member is refused", () => {
  const { privateJwk, publicJwk } = createWorkloadKey("Ed25519");
  const custom = (jwks: string): OidcDraft => ({
    preset: "custom",
    issuer: "https://kube.example.com",
    audience: "",
    claims: [claimDraft("sub", "system:serviceaccount:ns:bot")],
    jwks,
  });
  const keys = JSON.stringify({ keys: [{ ...publicJwk, kid: "k1" }] });
  const built = buildOidcCredential(custom(keys));
  assert.equal(built.credential?.type === "oidc" && built.credential.jwks?.keys[0]?.kid, "k1");
  assert.ok(buildOidcCredential(custom("{")).problems?.jwks);
  assert.ok(buildOidcCredential(custom(JSON.stringify({ keys: [privateJwk] }))).problems?.jwks);
  assert.ok(buildOidcCredential(custom(JSON.stringify({ keys: [] }))).problems?.jwks);
  // Keys typed under another preset are not sent.
  const github2 = buildOidcCredential(github({ jwks: keys }));
  assert.equal(github2.credential?.type === "oidc" && github2.credential.jwks, undefined);
});

test("a pasted key must be a public Ed25519 or P-256 JWK, and its thumbprint is shown", () => {
  for (const alg of ["Ed25519", "P-256"] as const) {
    const { privateJwk, publicJwk } = createWorkloadKey(alg);
    const built = buildKeyCredential(JSON.stringify(publicJwk));
    assert.deepEqual(built.credential, { type: "public_key", jwk: publicJwk });
    assert.equal(pastedKeyThumbprint(JSON.stringify(publicJwk)), jwkThumbprintUri(publicJwk));
    assert.match(buildKeyCredential(JSON.stringify(privateJwk)).problems?.key ?? "", /private key/);
  }
  assert.match(buildKeyCredential("").problems?.key ?? "", /Paste/);
  assert.match(buildKeyCredential("nope").problems?.key ?? "", /JSON/);
  assert.match(
    buildKeyCredential(JSON.stringify({ kty: "OKP", crv: "Ed448", x: "x" })).problems?.key ?? "",
    /Ed25519/,
  );
  assert.equal(pastedKeyThumbprint("{"), null);
});

test("the request schema refuses private members and unknown credential types", () => {
  const { privateJwk } = createWorkloadKey("P-256");
  assert.equal(
    workloadCredentialSchema.safeParse({ type: "public_key", jwk: privateJwk }).success,
    false,
  );
  assert.equal(workloadCredentialSchema.safeParse({ type: "saml" }).success, false);
});

test("the BFF knows the workload-identity codes, so they keep their status", () => {
  const status = (code: string) => knownErrorCode(new Error(code));
  for (const code of [
    "subject_token_invalid",
    "grant_proof_invalid",
    "grant_ambiguous",
    "grant_session_limit_reached",
    "issuer_unavailable",
    "grant_credential_invalid",
  ])
    assert.equal(status(code), code);
});
