"use client";

import type { LimitOrderView } from "@near-intents-agent-api/sdk";
import { DetailsDialog } from "@/components/shared/details-dialog";
import { MonoId } from "@/components/shared/identifiers";
import { Loading, Unavailable } from "@/components/shared/states";
import { StatusPill } from "@/components/shared/status";
import { useCatalog } from "@/features/assets";
import { formatDisplay } from "@/lib/format/amount";
import { accountTimestamp } from "@/lib/format/date";
import { labelFor, quoteEntries } from "../model/quote";
import { appFeeLabel, fillStatusLabel, fillStatusTone, orderTitle } from "./order-display";
import { useLimitOrder } from "./use-limit-orders";

type Find = (asset: string) => { symbol: string; decimals: number } | undefined;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-words">{children}</dd>
    </div>
  );
}

/** Scalars of one provider record, as the provider names them. */
function FieldList({ entries }: { entries: [string, string][] }) {
  return (
    <dl className="flex flex-col gap-1 text-xs">
      {entries.map(([key, value]) => (
        <div key={key} className="flex flex-wrap justify-between gap-3">
          <dt className="text-muted-foreground">{labelFor(key)}</dt>
          <dd className="console-id max-w-full break-all text-right">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Atomic units in the token's own units; null when either the amount or the token is unknown. */
function tokenAmount(
  raw: string | undefined,
  asset: string | undefined,
  find: Find,
): string | null {
  const token = asset ? find(asset) : undefined;
  return raw && token ? `${formatDisplay(raw, token.decimals)} ${token.symbol}` : null;
}

function Fills({ fills }: { fills: readonly unknown[] }) {
  return (
    <Field label="Fills">
      {fills.length === 0
        ? "None yet"
        : `${fills.length} partial ${fills.length === 1 ? "fill" : "fills"}`}
      {fills.map((fill, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: provider records have no id; the list is read-only
        <div key={index} className="mt-2">
          <FieldList entries={quoteEntries(fill as Record<string, unknown>)} />
        </div>
      ))}
    </Field>
  );
}

function Payouts({ order }: { order: LimitOrderView }) {
  const payouts = order.payouts ?? {};
  return (
    <>
      {order.payout_status ? (
        <Field label="Payout">
          {fillStatusLabel(order.payout_status)}
          {order.is_payout_status_final ? " (final)" : ""}
        </Field>
      ) : null}
      {Object.keys(payouts).length > 0 ? (
        <Field label="Payouts">
          <FieldList entries={quoteEntries(payouts as Record<string, unknown>)} />
        </Field>
      ) : null}
    </>
  );
}

function OrderFacts({ order }: { order: LimitOrderView }) {
  const { find } = useCatalog();
  const spent = order.side === "buy" ? order.quote_asset : order.base_asset;
  const quantity = tokenAmount(order.quantity, order.base_asset, find);
  const locked = tokenAmount(order.deposited_amount, spent, find);
  const fee = appFeeLabel(order);
  return (
    <dl className="space-y-4 text-sm">
      <Field label="Status">
        <StatusPill tone={fillStatusTone(order.fill_status)}>
          {fillStatusLabel(order.fill_status)}
        </StatusPill>
      </Field>
      <Field label="Order">{orderTitle(order, find)}</Field>
      {quantity ? <Field label="Quantity">{quantity}</Field> : null}
      {locked ? <Field label="Locked in the order">{locked}</Field> : null}
      {order.deadline ? <Field label="Deadline">{accountTimestamp(order.deadline)}</Field> : null}
      {order.created_at ? <Field label="Placed">{accountTimestamp(order.created_at)}</Field> : null}
      {fee ? <Field label="1Click fee">{fee} of the order. Not an API fee.</Field> : null}
      <Fills fills={Array.isArray(order.partial_fills) ? order.partial_fills : []} />
      <Payouts order={order} />
      <Field label="Order id">
        <MonoId value={order.order_id} head={10} tail={6} />
      </Field>
    </dl>
  );
}

/** The order read live: the list does not refresh an order's status, this read does. */
function OrderBody({ agentId, order }: { agentId: string; order: LimitOrderView }) {
  const live = useLimitOrder(agentId, order.order_id);
  if (live.isPending) return <Loading rows={3} />;
  if (live.error)
    return <Unavailable code={live.error.message} onRetry={() => void live.refetch()} />;
  return <OrderFacts order={live.data} />;
}

export function OrderDetails({ agentId, order }: { agentId: string; order: LimitOrderView }) {
  return (
    <DetailsDialog title="Limit order" description="Limit order details.">
      <OrderBody agentId={agentId} order={order} />
    </DetailsDialog>
  );
}
