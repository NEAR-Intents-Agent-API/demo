"use client";

export function PublicEmpty() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-8 text-center">
      <p className="text-sm font-medium">Nothing in the legacy public balance</p>
      <p className="max-w-72 text-xs leading-5 text-muted-foreground">
        Funds that arrive in the public balance can be shielded or withdrawn from here.
      </p>
    </div>
  );
}
