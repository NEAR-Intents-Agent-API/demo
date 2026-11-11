"use client";
import { useFunds } from "../funds-context";
import { useIdempotencyKey } from "../model/use-idempotency-key";
import { amountReason, useSourceAmount, useTracking } from "../model/use-move";
import { useFundsAction } from "../use-funds";

/**
 * Moving the legacy public balance into the confidential one. It is the only move between the
 * two: the confidential balance can never be made public again.
 */
export function useShieldFlow() {
  const funds = useFunds();
  const source = useSourceAmount(funds.publicHoldings);
  const { tracking, track, clear } = useTracking();
  const action = useFundsAction(funds.agent.id);
  const { token, atomic } = source;
  const key = useIdempotencyKey(`shield|${token?.assetId}|${atomic}`);

  const reason = amountReason({ ...source, empty: "Nothing in the public balance to shield" });
  const move = () => {
    if (!token || !atomic) return;
    action.mutate(
      {
        tool: "shield",
        args: { token: token.assetId, amount: atomic.toString(), idempotencyKey: key },
      },
      { onSuccess: track },
    );
  };

  const resetDraft = () => {
    clear();
    source.setPicked(null);
    source.setAmount("");
    action.reset();
  };
  return { resetDraft, source, tracking, clear, action, reason, move };
}
