"use client";

import { Callout } from "@/components/shared/callout";
import { ChainPicker, chainInfo, DEPOSIT_CHAINS } from "@/features/assets";
import { FlowButton, FlowError } from "../flows/flow-parts";
import { DepositAmountInput } from "./deposit-amount-input";
import { DepositStep } from "./deposit-step";
import { DepositTokenChoice } from "./deposit-token-choice";
import type { useDepositForm } from "./use-deposit-form";

export function DepositForm({ form }: { form: ReturnType<typeof useDepositForm> }) {
  const { action, chain, tokens, token, atomic, amount, reason, create } = form;

  return (
    <div className="flex flex-col gap-4">
      <DepositStep index={1} label="Network you are sending from">
        <ChainPicker
          chains={DEPOSIT_CHAINS}
          value={chain}
          onChange={form.changeChain}
          description="Network you are sending from"
          disabled={action.isPending}
        />
      </DepositStep>

      <DepositStep index={2} label={`Token on ${chainInfo(chain).name}`}>
        <DepositTokenChoice
          tokens={tokens}
          value={token?.assetId ?? null}
          onChange={form.setPicked}
          disabled={action.isPending}
        />
      </DepositStep>

      <DepositStep index={3} label="Amount (optional)">
        <DepositAmountInput
          token={token}
          amount={amount}
          onAmount={form.setAmount}
          atomic={atomic}
        />
      </DepositStep>

      <FlowError code={action.error?.message} />
      <FlowButton
        requiresGrant={false}
        busy={action.isPending}
        disabled={Boolean(reason)}
        onClick={create}
      >
        {reason ?? (action.isPending ? "Creating address…" : "Get deposit address")}
      </FlowButton>
      <Callout tone="info" compact>
        An address from NEAR Intents 1Click. Leave the amount empty to send any amount above the
        minimum it shows from {chainInfo(chain).name}, or enter one to send exactly that. A failed
        or late deposit is refunded into this agent&apos;s balance.
      </Callout>
    </div>
  );
}
