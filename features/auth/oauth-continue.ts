"use client";

/**
 * Resumes an MCP authorization after the owner signs in.
 *
 * A harness sends the browser to `/api/auth/oauth2/authorize?...`. Better Auth redirects an
 * unauthenticated visitor to `/login`, preserving the signed request in the URL. Once a
 * session exists, navigating back to the authorize endpoint continues the flow to the
 * consent page. Doing this explicitly keeps one login path for all four owner types instead
 * of depending on the provider resuming inside a sign-in response.
 *
 * The `sig`/`exp`/`ba_*` parameters are the provider's signed-query proof for its redirect
 * screens; the authorize endpoint ignores them, so they are dropped before navigating.
 */
import { pendingAuthorizationUrl } from "./utils";

/**
 * Navigates back into a pending authorization, if there is one. Returns true when the
 * browser is leaving, so the caller must not also push the dashboard route.
 */
export function continuePendingAuthorization(search = window.location.search): boolean {
  const url = pendingAuthorizationUrl(search);
  if (!url) return false;
  window.location.assign(url);
  return true;
}
