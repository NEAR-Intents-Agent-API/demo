"use client";

import { ArrowDown02Icon } from "@hugeicons/core-free-icons";
import { formatUnits } from "@/lib/format/amount";
import { AmountField } from "../flows/amount-field";
import { BalanceContext } from "../flows/balance-context";
import { FlowButton, FlowDivider, FlowError, FlowShell } from "../flows/flow-parts";
import { isAtomic } from "../model/quote";
import { SwapReview } from "./swap-review";
import type { useSwapFlow } from "./use-swap-flow";

export function SwapFlow({ view }: { view: ReturnType<typeof useSwapFlow> }) {
  const { funds, source, quote, waitingOnQuote, reason, action, title, execute } = view;
  const { token } = source;
  const outAtomic = isAtomic(view.amountOut) ? BigInt(view.amountOut) : null;

  return (
    <FlowShell
      ability="swap"
      tracking={view.tracking}
      title={view.tracking?.title ?? title}
      onDone={view.resetDraft}
    >
      <div className="flex flex-col gap-4">
        <BalanceContext label="Swap in" lane={view.lane} />
        <div className="flex flex-col gap-2">
          <AmountField
            label="You pay"
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
          <FlowDivider icon={ArrowDown02Icon} />
          <AmountField
            label="You receive"
            token={view.to}
            onToken={view.setTo}
            tokens={funds.tokens}
            amount={outAtomic && view.to ? formatUnits(outAtomic.toString(), view.to.decimals) : ""}
            readOnly
            hint={quote.isFetching ? "Getting the best route…" : null}
            disabled={action.isPending}
          />
        </div>

        <FlowError code={quote.error?.message} />
        {outAtomic && token && view.to && source.atomic ? (
          <SwapReview
            lane={view.lane}
            token={token}
            to={view.to}
            atomic={source.atomic}
            outAtomic={outAtomic}
            quote={quote.data ?? null}
          />
        ) : null}

        <FlowError code={action.error?.message} />
        <FlowButton
          busy={action.isPending || quote.isFetching}
          disabled={Boolean(reason) || waitingOnQuote}
          onClick={execute}
        >
          {reason ??
            (action.isPending ? "Submitting…" : `Swap ${token?.symbol} for ${view.to?.symbol}`)}
        </FlowButton>
      </div>
    </FlowShell>
  );
}
