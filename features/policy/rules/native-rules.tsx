"use client";

import { Callout } from "@/components/shared/callout";
import { Switch } from "@/components/ui/switch";
import {
  intentsContracts,
  nativeSchema,
  nearSignRecipient,
  signInDomainSchema,
} from "@/lib/agent-api/schemas";
import { NATIVE_WARNING, nativeEnabled, without } from "./native";
import { NativeDomains } from "./native-domains";
import { NativeSignIntent } from "./native-intents";
import { NativeAccountList } from "./native-list";
import type { Rules } from "./rules";
import { RulesSection } from "./rules-section";

const WRAPPED_NEAR = "nep141:wrap.near";

/** Why a NEAR account cannot join a native list, in the editor's words; null when it can. */
function accountProblem(list: readonly string[], account: string): string | null {
  if (intentsContracts.includes(account))
    return "intents.near and intents.far can never be listed.";
  if (list.includes(account)) return "Already listed.";
  return nativeSchema.shape.near.shape.call.safeParse([account]).success
    ? null
    : "Enter a NEAR account, such as app.near.";
}

/** Same for the sign-in list, which also takes domains and keeps the case as typed. */
function recipientProblem(list: readonly string[], recipient: string): string | null {
  if (intentsContracts.includes(recipient.toLowerCase()))
    return "intents.near and intents.far can never be listed.";
  if (list.includes(recipient)) return "Already listed.";
  return nearSignRecipient.safeParse(recipient).success
    ? null
    : "Enter a NEAR account or domain, such as app.example.com.";
}

/** Why a Sign-In-With-Solana domain cannot be listed; null when it can. */
function domainProblem(list: readonly string[], domain: string): string | null {
  if (list.includes(domain)) return "Already listed.";
  const parsed = signInDomainSchema.safeParse(domain);
  return parsed.success ? null : `${parsed.error.issues[0]?.message ?? "Invalid domain"}.`;
}

function ChainHeading({ title, address }: { title: string; address: string }) {
  return (
    <div className="flex flex-col gap-0.5 pt-1">
      <h4 className="text-sm font-medium">{title}</h4>
      <p className="text-xs leading-5 text-muted-foreground">{address}</p>
    </div>
  );
}

/**
 * The agent's own NEAR, EVM and Solana keys outside NEAR Intents. Every switch is off by default,
 * and none of the money rules applies to what it opens, so the warning sits above them all.
 */
export function NativeRules({
  rules,
  onChange,
  embedded = false,
}: {
  rules: Rules;
  onChange: (rules: Rules) => void;
  embedded?: boolean;
}) {
  const { near, evm, solana } = rules.native;
  const set = (native: Rules["native"]) => onChange({ ...rules, native });
  const nearUnlisted =
    near.transfer && rules.tokens !== "any" && !rules.tokens.includes(WRAPPED_NEAR);
  return (
    <RulesSection
      embedded={embedded}
      title="Native accounts"
      description="Let the agent use its own NEAR, EVM and Solana keys outside NEAR Intents. Off unless you switch a method on."
      aside={
        <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
          {nativeEnabled(rules.native) ? "On" : "All off"}
        </span>
      }
    >
      <Callout tone="warning" compact>
        {NATIVE_WARNING} Freezing the account refuses every native request from then on.
      </Callout>
      <div className="flex flex-col gap-4">
        <ChainHeading title="NEAR" address="The agent's NEAR account." />
        <NativeAccountList
          label="Sign messages for these services"
          description="The agent signs NEP-413 messages (site logins) with its NEAR key for a listed service, by NEAR account or domain. It never signs a transaction."
          placeholder="app.example.com"
          empty="No services: NEAR message signing is off."
          value={near.sign_message}
          problem={(recipient) => recipientProblem(near.sign_message, recipient)}
          keepCase
          onChange={(sign_message) => set({ ...rules.native, near: { ...near, sign_message } })}
        />
        <Switch
          className="py-0"
          checked={near.transfer}
          onChange={(transfer) => set({ ...rules.native, near: { ...near, transfer } })}
          label="Send NEAR"
          description="Send native NEAR from the agent's NEAR account to the NEAR accounts your destinations allow."
        />
        {nearUnlisted ? (
          <p className="text-xs leading-5 text-warning">
            Native NEAR counts as wNEAR: allow the wNEAR token under Allowed tokens, or every NEAR
            transfer is refused.
          </p>
        ) : null}
        <NativeAccountList
          label="Call these contracts"
          description="Function calls to a listed contract, with any method and deposit. Listing a token contract lets the agent send that token anywhere."
          placeholder="contract.near"
          empty="No contracts: NEAR calls are off."
          value={near.call}
          problem={(account) => accountProblem(near.call, account)}
          onChange={(call) => set({ ...rules.native, near: { ...near, call } })}
        />
      </div>
      <div className="flex flex-col gap-4 border-t pt-4">
        <ChainHeading title="EVM" address="One address on every EVM chain." />
        <NativeDomains
          value={evm.sign_typed_data}
          onChange={(sign_typed_data) => set({ ...rules.native, evm: { ...evm, sign_typed_data } })}
        />
        <Switch
          className="py-0"
          checked={evm.sign_message}
          onChange={(sign_message) => set({ ...rules.native, evm: { ...evm, sign_message } })}
          label="Sign messages"
          description="Any EIP-191 message from the agent's EVM address. It never signs a NEAR Intents payload; use the switch below."
        />
        <NativeSignIntent
          chain="EVM"
          value={evm.sign_intent}
          onChange={(sign_intent) =>
            set({
              ...rules.native,
              evm: sign_intent ? { ...evm, sign_intent } : without(evm, "sign_intent"),
            })
          }
        />
        <Switch
          className="py-0"
          checked={evm.sign_transaction}
          onChange={(sign_transaction) =>
            set({ ...rules.native, evm: { ...evm, sign_transaction } })
          }
          label="Sign transactions"
          description="Any transaction from the agent's EVM address. Signed, never sent; it can move everything there."
        />
      </div>
      <div className="flex flex-col gap-4 border-t pt-4">
        <ChainHeading title="Solana" address="The agent's Solana address." />
        <NativeAccountList
          label="Sign in to these domains"
          description="The API writes a Sign-In-With-Solana message for a listed domain and the agent signs it, so a service can log the agent in. Nothing else is signed. Use the lowercase host, with its port if it has one."
          placeholder="app.example.com"
          empty="No domains: Solana sign-in is off."
          value={solana.sign_in ?? []}
          problem={(domain) => domainProblem(solana.sign_in ?? [], domain)}
          onChange={(sign_in) =>
            set({
              ...rules.native,
              solana: sign_in.length ? { ...solana, sign_in } : without(solana, "sign_in"),
            })
          }
        />
        <Switch
          className="py-0"
          checked={solana.sign_message}
          onChange={(sign_message) => set({ ...rules.native, solana: { ...solana, sign_message } })}
          label="Sign messages"
          description="Any bytes from the agent's Solana address, including a 32-byte digest. That amounts to full control of the agent's Solana account in NEAR Intents; prefer sign-in or the NEAR Intents switch below."
        />
        <NativeSignIntent
          chain="Solana"
          value={solana.sign_intent}
          onChange={(sign_intent) =>
            set({
              ...rules.native,
              solana: sign_intent ? { ...solana, sign_intent } : without(solana, "sign_intent"),
            })
          }
        />
        <Switch
          className="py-0"
          checked={solana.sign_transfer === true}
          onChange={(sign_transfer) =>
            set({
              ...rules.native,
              solana: sign_transfer
                ? { ...solana, sign_transfer }
                : without(solana, "sign_transfer"),
            })
          }
          label="Sign transfers"
          description="One SOL or token transfer from the agent's Solana address, only to an address your destinations allow for withdrawals on Solana. Signed, never sent. The amount is not limited: budget and limits don't apply."
        />
        <Switch
          className="py-0"
          checked={solana.sign_transaction}
          onChange={(sign_transaction) =>
            set({ ...rules.native, solana: { ...solana, sign_transaction } })
          }
          label="Sign transactions"
          description="Any transaction from the agent's Solana address. Signed, never sent; it can move everything there."
        />
      </div>
    </RulesSection>
  );
}
