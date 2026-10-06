"use client";

export function PrivateEmpty() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <p className="text-sm font-medium">Nothing in the private balance</p>
      <p className="max-w-56 text-xs leading-5 text-muted-foreground">
        Deposit straight into it, or use Shield to move public funds here.
      </p>
    </div>
  );
}
