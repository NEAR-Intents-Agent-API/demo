"use client";
import { CopyButton } from "@/components/shared/identifiers";
import { Button } from "@/components/ui/button";

export function IssuedKey({ token, onDone }: { token: string | null; onDone: () => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm">
        {token
          ? "Copy this key now. It is shown only once. Use it as a Bearer token with this account’s endpoint. You can also select and copy it manually."
          : "Key already issued. Revoke this client and authorize again if the key was not saved."}
      </p>
      {token ? (
        <div className="flex items-center gap-2 rounded-xl border p-3">
          <code className="console-id min-w-0 flex-1 break-all">{token}</code>
          <CopyButton value={token} label="Copy API key" />
        </div>
      ) : null}
      <Button variant="outline" onClick={onDone}>
        Done
      </Button>
    </div>
  );
}
