/** Deterministic placeholder email for a passkey-first demo user. */
export function passkeyPlaceholderEmail(userId: string): string {
  return `${userId}@passkey.demo.invalid`;
}

/** The identity a passkey-first registration will create. Nothing is stored until it verifies. */
export function passkeyRegistrationUser(): { id: string; name: string; displayName: string } {
  const id = crypto.randomUUID();
  const name = `Passkey ${id.slice(0, 8)}`;
  return { id, name, displayName: name };
}
