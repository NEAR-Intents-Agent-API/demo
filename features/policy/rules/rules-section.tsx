/** Flat section with a compact heading, explanation and related controls. */
export function RulesSection({
  title,
  description,
  aside,
  children,
  embedded = false,
}: {
  title: string;
  description: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
  embedded?: boolean;
}) {
  if (embedded)
    return (
      <div className="space-y-4">
        {aside ? <div>{aside}</div> : null}
        {children}
      </div>
    );
  return (
    <section className="flex min-w-0 flex-col gap-3 border-b pb-4 last:border-b-0 last:pb-0">
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-medium">{title}</h3>
          {aside}
        </div>
        <p className="max-w-2xl text-xs leading-5 text-muted-foreground">{description}</p>
      </header>
      {children}
    </section>
  );
}
