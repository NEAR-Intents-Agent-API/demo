/**
 * The SIWN login message, shared by the browser (which signs it) and the auth server (which
 * requires it). NEP-413 has no domain field: the `recipient` and this text are what the wallet
 * shows, so both name the host.
 */
export function nearLoginMessage(recipient: string): string {
  return `Sign in to ${recipient}`;
}
