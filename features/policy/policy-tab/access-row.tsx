import { MonoId } from "@/components/shared/identifiers";
import { StatusPill } from "@/components/shared/status";
import { Button } from "@/components/ui/button";
import { ACCESS_STATUS_LABEL, type AccessGrantView, accessWhen } from "@/features/funds";
import { claimsText, GRANT_KIND_LABEL } from "@/lib/agent-api/workload-grants";

/** Active grants first, then the ended ones; the API already orders them so. */
export function AccessList({
  grants,
  onRevoke,
  revoking = false,
}: {
  grants: readonly AccessGrantView[];
  /** Revokes one workload grant; the dashboard's and clients' grants are revoked where they connected. */
  onRevoke?: (grantId: string) => void;
  revoking?: boolean;
}) {
  const active = grants.filter((grant) => grant.status === "active").length;
  return (
    <div>
      <p className="mb-2 text-sm">
        {active === 1 ? "1 active grant" : `${active} active grants`}
        {grants.length > active ? ` · ${grants.length - active} ended` : ""}
      </p>
      <ul className="divide-y">
        {grants.map((grant) => (
          <AccessRow key={grant.grantId} grant={grant} onRevoke={onRevoke} revoking={revoking} />
        ))}
      </ul>
    </div>
  );
}

/** What the owner signed about a workload, line by line; nothing for a token grant. */
function WorkloadDetails({ grant }: { grant: AccessGrantView }) {
  const { binding } = grant;
  return (
    <div className="mt-1 space-y-0.5 text-xs leading-5 break-words text-muted-foreground">
      {binding?.type === "oidc" ? (
        <>
          <p>
            Issuer {binding.issuer}
            {binding.platform ? ` (${binding.platform})` : ""}
          </p>
          <p>Pins {claimsText(binding.claims)}</p>
          <p>Token audience {binding.audience}</p>
          {binding.signedKeys.length > 0 ? (
            <p>
              {binding.signedKeys.length === 1
                ? "1 issuer key"
                : `${binding.signedKeys.length} issuer keys`}{" "}
              signed into the grant
            </p>
          ) : null}
        </>
      ) : binding?.type === "public_key" ? (
        <p>
          {binding.curve} key <span className="console-id">{binding.thumbprint}</span>
        </p>
      ) : (
        <p>This dashboard cannot show what this credential binds.</p>
      )}
      <p className="flex items-center gap-1">
        Grant ID <MonoId value={grant.grantId} head={10} tail={6} label="Copy grant ID" />
      </p>
    </div>
  );
}

/** One grant on the account: its name and kind, whether it still works, and when it ends or ended. */
export function AccessRow({
  grant,
  onRevoke,
  revoking = false,
}: {
  grant: AccessGrantView;
  onRevoke?: (grantId: string) => void;
  revoking?: boolean;
}) {
  const workload = grant.kind !== "token";
  return (
    <li className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium">{grant.label}</p>
          <span className="text-xs text-muted-foreground">{GRANT_KIND_LABEL[grant.kind]}</span>
          {grant.status === "active" ? null : (
            <StatusPill tone="blocked">{ACCESS_STATUS_LABEL[grant.status]}</StatusPill>
          )}
        </div>
        <p className="mt-1 text-xs leading-5 break-words text-muted-foreground">
          {grant.status === "active" ? "Account rules apply · " : ""}
          {accessWhen(grant)}
        </p>
        {workload ? <WorkloadDetails grant={grant} /> : null}
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-xs text-muted-foreground">
          {grant.holder === "dashboard" ? "This dashboard" : workload ? "Workload" : "Client"}
        </span>
        {workload && grant.status === "active" && onRevoke ? (
          <Button
            variant="ghost"
            size="xs"
            disabled={revoking}
            onClick={() => onRevoke(grant.grantId)}
          >
            Revoke
          </Button>
        ) : null}
      </div>
    </li>
  );
}
