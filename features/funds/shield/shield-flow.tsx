"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { formatDisplay } from "@/lib/format/amount";
import { AmountField } from "../flows/amount-field";
import { FlowButton, FlowError, FlowShell } from "../flows/flow-parts";
import { ReviewCard } from "../flows/review-card";
import type { useShieldFlow } from "./use-shield-flow";

export function ShieldFlow({ view }: { view: ReturnType<typeof useShieldFlow> }) {
  const { source, tracking, action, reason, move } = view;
  const { token, atomic } = source;

  return (
    <FlowShell tracking={tracking} title={`Shield ${token?.symbol ?? ""}`} onDone={view.resetDraft}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 text-sm">
          <span className="font-medium">Legacy public balance</span>
          <HugeiconsIcon icon={ArrowRight01Icon} className="size-4 text-muted-foreground" />
          <span className="font-medium">Confidential balance</span>
        </div>
        <p className="-mt-2 text-xs leading-5 text-muted-foreground">
          Moves funds into the confidential balance, off the public NEAR chain. The move itself is
          public, and operators and solvers can still see the funds. It cannot be undone: the
          confidential balance cannot be made public again.
        </p>

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
              { label: "Counts toward budget", value: "No" },
            ]}
          />
        ) : null}

        <FlowError error={action.error} />
        <FlowButton busy={action.isPending} disabled={Boolean(reason)} onClick={move}>
          {reason ?? (action.isPending ? "Moving…" : "Shield")}
        </FlowButton>
      </div>
    </FlowShell>
  );
}
