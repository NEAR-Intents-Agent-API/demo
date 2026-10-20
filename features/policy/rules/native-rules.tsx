"use client";

import { Callout } from "@/components/shared/callout";
import { Switch } from "@/components/ui/switch";
import { intentsContracts, nativeSchema, nearSignRecipient } from "@/lib/agent-api/schemas";
import { NATIVE_WARNING, nativeEnabled } from "./native";
import { NativeDomains } from "./native-domains";
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
        {NATIVE_WARNING} Freezing the account stops them all.
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
          description="Send native NEAR from the agent's NEAR account to any account. Destinations do not apply."
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
          description="Any EIP-191 message from the agent's EVM address."
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
        <Switch
          className="py-0"
          checked={solana.sign_message}
          onChange={(sign_message) => set({ ...rules.native, solana: { ...solana, sign_message } })}
          label="Sign messages"
          description="Any off-chain message from the agent's Solana address."
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
