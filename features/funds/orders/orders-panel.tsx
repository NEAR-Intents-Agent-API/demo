"use client";

import type { LimitOrderView } from "@near-intents-agent-api/sdk";
import { useState } from "react";
import { Callout } from "@/components/shared/callout";
import { Choice } from "@/components/shared/choice";
import { Empty, Loading, Pending, Unavailable } from "@/components/shared/states";
import { StatusPill } from "@/components/shared/status";
import { Button } from "@/components/ui/button";
import { useCatalog } from "@/features/assets";
import { accountTimestamp } from "@/lib/format/date";
import { errorMessage } from "@/lib/http/messages";
import { useFunds } from "../funds-context";
import { useFundsAction } from "../use-funds";
import { CancelAllDialog } from "./cancel-all-dialog";
import { OrderDetails } from "./order-details";
import { fillStatusLabel, fillStatusTone, isResting, orderTitle } from "./order-display";
import { PlaceOrderDialog } from "./place-order-dialog";
import { useLimitOrders } from "./use-limit-orders";

type Scope = "open" | "all";

/** The account's limit orders, read live from the provider, with place and cancel. */
export function OrdersPanel() {
  const funds = useFunds();
  const agentId = funds.agent.id;
  const [scope, setScope] = useState<Scope>("open");
  const [placing, setPlacing] = useState(false);
  const [cancellingAll, setCancellingAll] = useState(false);
  const orders = useLimitOrders(agentId, scope === "open");
  const anyResting = (orders.data?.data ?? []).some(isResting);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Choice<Scope>
          label="Orders shown"
          value={scope}
          onChange={setScope}
          options={[
            { value: "open", label: "Open" },
            { value: "all", label: "All" },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          {anyResting ? (
            <Button variant="outline" onClick={() => setCancellingAll(true)}>
              Cancel all
            </Button>
          ) : null}
          <Button onClick={() => setPlacing(true)}>Place order</Button>
        </div>
      </div>
      {funds.rules?.abilities.limit_order === false ? (
        <Callout tone="warning" compact>
          Limit orders are off in this account's rules, so new orders are refused. Orders that are
          still resting can be cancelled here.
        </Callout>
      ) : null}
      {funds.access ? null : (
        <Callout tone="info" compact>
          Placing and cancelling orders needs dashboard authorization.{" "}
          <button
            type="button"
            className="underline underline-offset-4"
            onClick={funds.enableAccess}
          >
            Authorize dashboard
          </button>
        </Callout>
      )}
      <OrderList agentId={agentId} scope={scope} orders={orders} />

      {placing ? <PlaceOrderDialog onClose={() => setPlacing(false)} /> : null}
      {cancellingAll ? (
        <CancelAllDialog agentId={agentId} onClose={() => setCancellingAll(false)} />
      ) : null}
    </div>
  );
}

function OrderList({
  agentId,
  scope,
  orders,
}: {
  agentId: string;
  scope: Scope;
  orders: ReturnType<typeof useLimitOrders>;
}) {
  const { find } = useCatalog();
  const cancel = useFundsAction(agentId);
  const cancelling = cancel.isPending ? String(cancel.variables?.args.orderId) : null;
  const rows = orders.data?.data ?? [];
  return (
    <>
      {cancel.error ? (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage(cancel.error)}
        </p>
      ) : null}
      <div className="min-w-0 overflow-hidden rounded-lg border bg-card">
        {orders.isPending ? (
          <Loading rows={3} className="p-4 sm:p-5" />
        ) : orders.error ? (
          <Unavailable
            code={orders.error.message}
            onRetry={() => void orders.refetch()}
            className="m-4 sm:m-5"
          />
        ) : rows.length === 0 ? (
          <Empty
            className="m-4 border-0"
            title={scope === "open" ? "No open orders" : "No orders yet"}
            detail="A limit order rests at a price you set and fills when the market reaches it. Its funds are locked until it fills, you cancel it or it expires."
          />
        ) : (
          <ul className="divide-y">
            {rows.map((order) => (
              <OrderRow
                key={order.order_id}
                agentId={agentId}
                order={order}
                title={orderTitle(order, find)}
                cancelling={cancelling === order.order_id}
                disabled={cancel.isPending}
                onCancel={() =>
                  cancel.mutate({ tool: "cancel_limit_order", args: { orderId: order.order_id } })
                }
              />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function OrderRow({
  agentId,
  order,
  title,
  cancelling,
  disabled,
  onCancel,
}: {
  agentId: string;
  order: LimitOrderView;
  title: string;
  cancelling: boolean;
  disabled: boolean;
  onCancel: () => void;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-4 sm:px-5">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium break-words">{title}</p>
        <p className="text-xs text-muted-foreground">
          {order.created_at ? `Placed ${accountTimestamp(order.created_at)}` : null}
          {order.deadline ? ` · expires ${accountTimestamp(order.deadline)}` : null}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <StatusPill tone={fillStatusTone(order.fill_status)}>
          {fillStatusLabel(order.fill_status)}
        </StatusPill>
        <OrderDetails agentId={agentId} order={order} />
        {isResting(order) ? (
          <Button variant="outline" size="sm" disabled={disabled} onClick={onCancel}>
            {cancelling ? <Pending /> : null}
            Cancel
          </Button>
        ) : null}
      </div>
    </li>
  );
}
