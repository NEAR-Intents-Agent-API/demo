"use client";

import { Callout } from "@/components/shared/callout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChainPicker, chainInfo, DEPOSIT_CHAINS } from "@/features/assets";
import { FlowButton, FlowError } from "../flows/flow-parts";
import { DepositAmountInput } from "./deposit-amount-input";
import { DepositStep } from "./deposit-step";
import { DepositTokenChoice } from "./deposit-token-choice";
import type { useDepositForm } from "./use-deposit-form";

export function DepositForm({ form }: { form: ReturnType<typeof useDepositForm> }) {
  const { action, chain, tokens, token, atomic, amount, refund, needsRefund, reason, create } =
    form;

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

      <DepositStep index={3} label="Amount">
        <DepositAmountInput
          token={token}
          amount={amount}
          onAmount={form.setAmount}
          atomic={atomic}
        />
      </DepositStep>

      {needsRefund ? (
        <Label className="grid gap-2">
          Refund address if the deposit fails
          <Input
            value={refund}
            onChange={(event) => form.setRefund(event.target.value)}
            placeholder={`Your ${chainInfo(chain).name} address`}
            autoComplete="off"
            spellCheck={false}
          />
        </Label>
      ) : null}

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
        A one-time address from NEAR Intents 1Click. Send exactly this amount from{" "}
        {chainInfo(chain).name}; a solver credits the agent inside NEAR Intents, minus a small fee.
        A failed deposit is refunded on {chainInfo(chain).name}.
      </Callout>
    </div>
  );
}
