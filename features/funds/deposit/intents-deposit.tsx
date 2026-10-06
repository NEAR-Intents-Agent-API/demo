"use client";

import { Callout } from "@/components/shared/callout";
import { CopyButton } from "@/components/shared/identifiers";
import { TokenIcon } from "@/features/assets";
import { useFunds } from "../funds-context";

export function IntentsDeposit() {
  const funds = useFunds();
  const account = funds.agent.wallet?.near_account_id;
  if (!account) return null;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-6 text-muted-foreground">
        Send any token from another NEAR Intents account, for example from{" "}
        <span className="font-medium text-foreground">near-intents.org</span>. It arrives in the
        public balance instantly, with no fee. Use Shield afterwards to make it private.
      </p>
      <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-4">
        <TokenIcon symbol="NEAR" chain="near" size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">Agent&rsquo;s NEAR Intents account</p>
          <p className="console-id mt-0.5 text-sm break-all text-foreground">{account}</p>
        </div>
        <CopyButton
          value={account}
          label="Copy account"
          className="size-9 rounded-md border bg-card"
        />
      </div>
      <Callout tone="info" compact>
        This is an account inside NEAR Intents, not an address on the NEAR chain. Sending tokens to
        it with a regular NEAR wallet transfer does not credit the agent.
      </Callout>
    </div>
  );
}
