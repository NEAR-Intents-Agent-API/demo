import { shortId } from "@/components/shared/identifiers";
import type { DemoIdentity } from "./types";

export type IdentityLabel = {
  /** What the header button shows: the whole value when it is short, else middle-elided. */
  short: string;
  /** The complete value, for the menu and for copying. */
  full: string;
};

/**
 * The signed-in owner as people recognise it: the NEAR account, the EVM address or the
 * passkey's display name. The account id and address are the owner's identity everywhere else
 * in the dashboard, so the header shows them rather than an initial.
 */
export function identityLabel(identity: DemoIdentity): IdentityLabel {
  const full =
    identity.ownerType === "passkey" || !identity.ownerLabel
      ? identity.name.trim()
      : identity.ownerLabel;
  if (!full) return { short: "Account", full: "" };
  return { short: identity.ownerType === "evm" ? shortId(full, 6, 4) : shortId(full, 10, 8), full };
}
