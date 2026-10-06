import { cn } from "@/lib/utils";

/**
 * Page furniture shared by every screen.
 *
 * The header answers three questions in a fixed order — where am I, what is this, what can I
 * do here — so a visitor never has to hunt for the primary action. The panel is the same box
 * on every page; only its contents change.
 */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}
    >
      <div className="min-w-0">
        {eyebrow ? <p className="console-eyebrow">{eyebrow}</p> : null}
        <h1 className="console-title mt-2 text-2xl sm:text-[1.7rem]">{title}</h1>
        {description ? (
          <p className="mt-2.5 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

/**
 * A titled section of a page. `plain` drops the border for content that already reads as its
 * own block, so panels do not nest boxes inside boxes.
 */
export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  plain = false,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  plain?: boolean;
}) {
  return (
    <section className={cn(plain ? "" : "console-panel rounded-lg", className)}>
      {title ? (
        <div
          className={cn(
            "flex flex-wrap items-start justify-between gap-x-6 gap-y-3",
            plain ? "pb-4" : "px-5 pt-5 pb-3",
          )}
        >
          <div className="min-w-0">
            <h2 className="console-heading">{title}</h2>
            {description ? (
              <p className="mt-1.5 max-w-2xl text-xs leading-5 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn(plain ? "" : title ? "px-5 pb-5" : "p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Label/value row: the demo's standard way of showing one fact the server reported. */
export function Fact({
  label,
  value,
  mono = false,
  className,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("console-row text-sm", className)}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("max-w-[26rem] truncate text-right", mono ? "console-id" : "")}>{value}</dd>
    </div>
  );
}

/** A list of facts separated by hairlines, so a card of claims scans as a table. */
export function FactList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <dl className={cn("space-y-1", className)}>{children}</dl>;
}
