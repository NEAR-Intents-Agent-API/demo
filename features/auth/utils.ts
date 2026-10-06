const PROVIDER_PARAMS = new Set(["sig", "exp", "ba_iat", "ba_pl", "ba_param"]);

/** Keep the provider's OAuth request intact, omitting only its redirect-screen signature. */
export function pendingAuthorizationUrl(search: string): string | null {
  const params = new URLSearchParams(search);
  if (!params.has("sig") || !params.get("client_id")) return null;
  const forwarded = new URLSearchParams();
  for (const [key, value] of params.entries()) {
    if (!PROVIDER_PARAMS.has(key)) forwarded.append(key, value);
  }
  return `/api/auth/oauth2/authorize?${forwarded.toString()}`;
}

export function loginReturnTo(value: string | string[] | undefined): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    [...value].some((char) => char.charCodeAt(0) <= 32)
  )
    return "/how-it-works";
  const url = new URL(value, "https://demo.invalid");
  if (
    url.origin !== "https://demo.invalid" ||
    !(url.pathname === "/how-it-works" || /^\/agents(?:\/|$)/.test(url.pathname))
  )
    return "/how-it-works";
  return `${url.pathname}${url.search}${url.hash}`;
}
