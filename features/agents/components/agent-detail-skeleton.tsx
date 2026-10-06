export function AgentDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      <div className="flex flex-col gap-5 lg:flex-row lg:justify-between">
        <div className="h-20 w-full max-w-lg animate-pulse rounded-xl bg-muted" />
        <div className="h-44 w-full animate-pulse rounded-xl bg-muted lg:w-88" />
      </div>
      <div className="h-10 w-full max-w-md animate-pulse rounded-md bg-muted" />
      <div className="h-80 w-full max-w-3xl animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
