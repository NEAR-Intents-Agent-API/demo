"use client";

import { Callout } from "@/components/shared/callout";
import { Choice } from "@/components/shared/choice";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { AmountField } from "../flows/amount-field";
import { FlowButton, FlowError, FlowShell } from "../flows/flow-parts";
import { QuoteWarnings } from "../flows/quote-warnings";
import { ReceiptFields } from "../flows/receipt-fields";
import { balanceLookup } from "../funds-context";
import { OrderReview } from "./order-review";
import { DEADLINES, type DeadlineId, type usePlaceOrder } from "./use-place-order";

export function PlaceOrderFlow({
  view,
  onDone,
}: {
  view: ReturnType<typeof usePlaceOrder>;
  onDone: () => void;
}) {
  const { funds, base, quote, preview, action, side } = view;
  const balances = balanceLookup(view.holdings);
  const spendToken = side === "sell" ? base : quote;
  return (
    <FlowShell
      ability="limit_order"
      type="limit_order"
      tracking={view.tracking}
      title={view.tracking?.title ?? view.title}
      onDone={onDone}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-muted-foreground">Order</span>
          <Choice
            label="Order side"
            className="w-full sm:w-auto"
            value={side}
            onChange={view.setSide}
            disabled={action.isPending}
            options={[
              { value: "sell", label: "Sell" },
              { value: "buy", label: "Buy" },
            ]}
          />
        </div>
        <div className="flex flex-col gap-2">
          <AmountField
            label={side === "sell" ? "You sell" : "You buy"}
            token={base}
            onToken={view.setBase}
            tokens={funds.tokens}
            balances={side === "sell" ? balances : undefined}
            amount={view.amount}
            onAmount={view.setAmount}
            disabled={action.isPending}
          />
          <AmountField
            label={`Price for 1 ${base?.symbol ?? "token"}`}
            token={quote}
            onToken={view.setQuote}
            tokens={funds.tokens}
            balances={side === "buy" ? balances : undefined}
            amount={view.price}
            onAmount={view.setPrice}
            hint="The order fills at this price or better."
            disabled={action.isPending}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="order-deadline" className="text-sm font-normal text-muted-foreground">
            Cancel the order if unfilled after
          </Label>
          <NativeSelect
            id="order-deadline"
            value={view.deadlineId}
            disabled={action.isPending}
            onChange={(event) => view.setDeadlineId(event.target.value as DeadlineId)}
          >
            {DEADLINES.map((deadline) => (
              <NativeSelectOption key={deadline.id} value={deadline.id}>
                {deadline.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        <ReceiptFields labels={view.labels} id="order" disabled={action.isPending} />

        <FlowError error={preview.error} />
        <QuoteWarnings warnings={preview.data?.warnings ?? []} token={spendToken} />
        {preview.data?.ownerApproval ? (
          <Callout tone="info" compact>
            The account's rules hold orders for your approval. This one will wait in Activity until
            you approve it.
          </Callout>
        ) : null}
        {base && quote && preview.data?.quote ? (
          <OrderReview side={side} base={base} quote={quote} preview={preview.data} />
        ) : null}

        <FlowError error={action.error} />
        <FlowButton
          busy={action.isPending || preview.isFetching}
          disabled={Boolean(view.reason) || view.waitingOnPreview}
          onClick={view.execute}
        >
          {view.reason ?? (action.isPending ? "Placing…" : "Place limit order")}
        </FlowButton>
      </div>
    </FlowShell>
  );
}
