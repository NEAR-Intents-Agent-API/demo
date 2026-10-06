"use client";

export function PublicEmpty() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-8 text-center">
      <p className="text-sm font-medium">No funds yet</p>
      <p className="max-w-72 text-xs leading-5 text-muted-foreground">
        Deposit from a supported network or another NEAR Intents account to get started.
      </p>
    </div>
  );
}
