import { GRANT_LABEL_MAX } from "@/lib/agent-api/access-input";

const PREFIX = "MCP: ";

/** The longest client name whose grant label ("MCP: " + name) still fits the 64 character label. */
export const MCP_CLIENT_NAME_MAX = GRANT_LABEL_MAX - PREFIX.length;

/** Why an owner-typed client name cannot be used, or null. The name is part of the signed label. */
export function mcpClientNameProblem(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Name this client so you can recognise it later";
  if (trimmed.length > MCP_CLIENT_NAME_MAX)
    return `Use at most ${MCP_CLIENT_NAME_MAX} characters (this is ${trimmed.length})`;
  if (!/^[\x20-\x7e]+$/.test(trimmed))
    return "Use plain letters, numbers and punctuation only; the name is signed in your wallet";
  return null;
}

/**
 * The label signed for a client's grant. Typed names are validated before they get here; a name
 * a registered OAuth client chose for itself is made signable (ASCII, shortened with "...").
 */
export function mcpGrantLabel(name: string): string {
  const printable = name.replace(/[^\x20-\x7e]+/g, "?").trim();
  const label = `${PREFIX}${printable}`;
  return label.length <= GRANT_LABEL_MAX ? label : `${label.slice(0, GRANT_LABEL_MAX - 3)}...`;
}
