import { StatusPill } from "@/components/shared/status";
import { ACCESS_STATUS_LABEL, type AccessGrantView, accessWhen } from "@/features/funds";

/** Active grants first, then the ended ones; the API already orders them so. */
export function AccessList({ grants }: { grants: readonly AccessGrantView[] }) {
  const active = grants.filter((grant) => grant.status === "active").length;
  return (
    <div>
      <p className="mb-2 text-sm">
        {active === 1 ? "1 active grant" : `${active} active grants`}
        {grants.length > active ? ` · ${grants.length - active} ended` : ""}
      </p>
      <ul className="divide-y">
        {grants.map((grant) => (
          <AccessRow key={grant.grantId} grant={grant} />
        ))}
      </ul>
    </div>
  );
}

/** One grant on the account: its name, whether it still works, and when it ends or ended. */
export function AccessRow({ grant }: { grant: AccessGrantView }) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium">{grant.label}</p>
          {grant.status === "active" ? null : (
            <StatusPill tone="blocked">{ACCESS_STATUS_LABEL[grant.status]}</StatusPill>
          )}
        </div>
        <p className="mt-1 text-xs leading-5 break-words text-muted-foreground">
          {grant.status === "active" ? "Account rules apply · " : ""}
          {accessWhen(grant)}
        </p>
      </div>
      <span className="text-xs text-muted-foreground">
        {grant.holder === "dashboard" ? "This dashboard" : "Client"}
      </span>
    </li>
  );
}
