"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { formatDisplay } from "@/lib/format/amount";
import { AmountField } from "../flows/amount-field";
import { FlowButton, FlowError, FlowShell } from "../flows/flow-parts";
import { ReviewCard } from "../flows/review-card";
import { DirectionSwitch } from "./direction-switch";
import type { usePrivateFlow } from "./use-private-flow";

export function PrivateFlow({ view }: { view: ReturnType<typeof usePrivateFlow> }) {
  const { direction, setDirection, source, tracking, action, copy, reason, move } = view;
  const { token, atomic } = source;

  return (
    <FlowShell
      ability="confidential"
      tracking={tracking}
      title={`${copy.label}: ${token?.symbol ?? ""}`}
      onDone={view.resetDraft}
    >
      <div className="flex flex-col gap-4">
        <DirectionSwitch
          value={direction}
          onChange={(next) => {
            setDirection(next);
            source.setAmount("");
          }}
        />

        <div className="flex items-center gap-3 text-sm">
          <span className="font-medium">{copy.from}</span>
          <HugeiconsIcon icon={ArrowRight01Icon} className="size-4 text-muted-foreground" />
          <span className="font-medium">{copy.to}</span>
        </div>
        <p className="-mt-2 text-xs leading-5 text-muted-foreground">{copy.blurb}</p>

        <AmountField
          label="Amount"
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

        {token && atomic ? (
          <ReviewCard
            rows={[
              {
                label: "Moving",
                value: `${formatDisplay(atomic.toString(), token.decimals)} ${token.symbol}`,
                emphasis: true,
              },
              { label: "Fee", value: "None" },
              { label: "Counts toward budget", value: "No" },
            ]}
          />
        ) : null}

        <FlowError code={action.error?.message} />
        <FlowButton busy={action.isPending} disabled={Boolean(reason)} onClick={move}>
          {reason ?? (action.isPending ? "Moving…" : copy.label)}
        </FlowButton>
      </div>
    </FlowShell>
  );
}
