import { Disclosure } from "@/components/shared/disclosure";
import type { McpClientView } from "../api";

export function ClientGrantDetails({ client }: { client: McpClientView }) {
  return (
    <Disclosure summary="Grant details">
      <dl className="mt-3 space-y-3 text-xs">
        <div>
          <dt className="text-muted-foreground">Expires</dt>
          <dd className="mt-1">
            {client.expiresAt ? new Date(client.expiresAt).toLocaleString() : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Permissions</dt>
          <dd className="mt-1 break-words leading-5">
            Account rules apply. Actions, destinations and spending budget are shared with every
            grant. Rule changes apply without reconnecting this client.
          </dd>
        </div>
        {client.prefix ? (
          <div>
            <dt className="text-muted-foreground">Key prefix</dt>
            <dd className="console-id mt-1">{client.prefix}…</dd>
          </div>
        ) : null}
      </dl>
    </Disclosure>
  );
}
