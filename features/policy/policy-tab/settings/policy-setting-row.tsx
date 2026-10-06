export function PolicySettingRow({
  title,
  description,
  value,
  action,
}: {
  title: string;
  description: React.ReactNode;
  value: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-2 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_8.5rem]">
      <div className="min-w-0">
        <h4 className="text-sm font-medium">{title}</h4>
        <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      <div className="col-span-2 row-start-2 flex min-w-0 flex-wrap items-center gap-2 text-sm lg:col-span-1 lg:col-start-2 lg:row-start-1">
        {value}
      </div>
      {action ? (
        <div className="col-start-2 row-start-1 flex items-center justify-end lg:col-start-3">
          {action}
        </div>
      ) : null}
    </div>
  );
}
