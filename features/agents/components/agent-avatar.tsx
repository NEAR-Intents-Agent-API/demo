"use client";

export function AgentAvatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="grid size-10 shrink-0 place-items-center rounded-[8px] border border-primary/40 text-sm font-semibold text-primary uppercase"
    >
      {Array.from(name.trim()).slice(0, 2).join("") || "A"}
    </span>
  );
}
