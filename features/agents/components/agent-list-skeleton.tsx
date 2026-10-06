"use client";

export function AgentListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      {["skeleton-a", "skeleton-b", "skeleton-c"].map((key) => (
        <div key={key} className="h-24 animate-pulse rounded-[8px] border bg-card" />
      ))}
    </div>
  );
}
