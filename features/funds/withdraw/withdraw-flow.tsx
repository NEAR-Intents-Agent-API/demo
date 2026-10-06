"use client";

import { chainInfo } from "@/features/assets";
import { destinationName } from "../access/destination-utils";
import { AmountField } from "../flows/amount-field";
import { BalanceContext } from "../flows/balance-context";
import { DestinationPicker } from "../flows/destination-picker";
import { FlowButton, FlowError, FlowShell } from "../flows/flow-parts";
import { NetworkChoice } from "./network-choice";
import type { useWithdrawFlow } from "./use-withdraw-flow";
import { WithdrawReview } from "./withdraw-review";

export function WithdrawFlow({ view }: { view: ReturnType<typeof useWithdrawFlow> }) {
  const { funds, source, preview, args, reason, action, submit } = view;
  const { token, atomic } = source;

  return (
    <FlowShell
      ability="withdraw"
      tracking={view.tracking}
      title={`Withdraw ${token?.symbol ?? ""} to ${view.network ? chainInfo(view.network).name : ""}`}
      onDone={view.resetDraft}
    >
      <div className="flex flex-col gap-4">
        <BalanceContext label="Withdraw from" lane={view.lane} />
        <AmountField
          label="You withdraw"
          token={token}
          onToken={(next) => {
            source.setPicked(next);
            view.setChain(null);
          }}
          tokens={source.sources}
          balances={source.balances}
          amount={source.amount}
          onAmount={source.setAmount}
          showQuickFill
          error={source.overMessage}
          disabled={action.isPending}
        />

        <NetworkChoice
          token={token}
          network={view.network}
          networks={view.networks}
          onChange={view.setChain}
          disabled={action.isPending}
        />

        <DestinationPicker
          label="Destination address"
          emptyTitle="No approved addresses"
          empty="Approve an address on your selected network to withdraw funds."
          actionLabel="Approve address"
          destinations={view.suitable.map((item) => destinationName(item))}
          value={view.recipient}
          onChange={view.setRecipient}
          open={view.open}
          onManage={() =>
            funds.manageDestinations({ action: "withdraw", chain: view.network ?? undefined })
          }
        />

        {args && token && atomic && view.network ? (
          <WithdrawReview
            lane={view.lane}
            token={token}
            atomic={atomic}
            network={view.network}
            recipient={args.to}
            loading={preview.isFetching}
            quote={preview.data ?? null}
          />
        ) : null}

        <FlowError code={preview.error?.message ?? action.error?.message} />
        <FlowButton
          busy={action.isPending}
          disabled={Boolean(reason) || preview.isFetching || Boolean(preview.error)}
          onClick={submit}
        >
          {reason ?? (action.isPending ? "Withdrawing…" : `Withdraw ${token?.symbol}`)}
        </FlowButton>
      </div>
    </FlowShell>
  );
}
