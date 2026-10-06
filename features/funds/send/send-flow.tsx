"use client";

import { formatDisplay } from "@/lib/format/amount";
import { AmountField } from "../flows/amount-field";
import { BalanceContext } from "../flows/balance-context";
import { DestinationPicker } from "../flows/destination-picker";
import { FlowButton, FlowError, FlowShell } from "../flows/flow-parts";
import { ReviewCard } from "../flows/review-card";
import type { useSendFlow } from "./use-send-flow";

export function SendFlow({ view }: { view: ReturnType<typeof useSendFlow> }) {
  const {
    funds,
    lane,
    source,
    setRecipient,
    destinations,
    recipient,
    tracking,
    action,
    confidential,
    reason,
    send,
  } = view;
  const { token, atomic } = source;

  return (
    <FlowShell
      ability="transfer"
      tracking={tracking}
      title={`Transfer ${token?.symbol ?? ""}`}
      onDone={view.resetDraft}
    >
      <div className="flex flex-col gap-4">
        <BalanceContext label="Transfer from" lane={lane} />
        <AmountField
          label="You send"
          token={token}
          onToken={source.setPicked}
          tokens={source.sources}
          balances={source.balances}
          amount={source.amount}
          onAmount={source.setAmount}
          showQuickFill
          error={source.overMessage}
          disabled={action.isPending}
        />

        <DestinationPicker
          label="Recipient"
          emptyTitle="No approved recipients"
          empty="Approve a NEAR Intents account to send funds to it."
          actionLabel="Approve recipient"
          destinations={destinations}
          value={view.displayRecipient}
          onChange={setRecipient}
          open={view.open}
          onManage={() => funds.manageDestinations({ action: view.transferAction })}
        />

        {token && atomic && recipient ? (
          <ReviewCard
            rows={[
              { label: "Balance", value: confidential ? "Private balance" : "Public balance" },
              {
                label: "Amount",
                value: `${formatDisplay(atomic.toString(), token.decimals)} ${token.symbol}`,
                emphasis: true,
              },
              {
                label: "Route",
                value: confidential ? "Private NEAR Intents transfer" : "NEAR Intents · no fee",
              },
              { label: "Recipient", value: <span className="console-id">{recipient}</span> },
            ]}
          />
        ) : null}

        <FlowError code={action.error?.message} />
        <FlowButton busy={action.isPending} disabled={Boolean(reason)} onClick={send}>
          {reason ?? (action.isPending ? "Transferring…" : `Transfer ${token?.symbol}`)}
        </FlowButton>
      </div>
    </FlowShell>
  );
}
