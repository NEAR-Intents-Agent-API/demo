"use client";
import { Logout01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { CopyButton } from "@/components/shared/identifiers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { identityLabel } from "./identity-label";
import type { DemoIdentity } from "./types";

export function DemoAccountMenu({
  identity,
  onSignOut,
  signingOut,
  siteStyle = false,
}: {
  identity: DemoIdentity;
  onSignOut: () => void;
  signingOut: boolean;
  siteStyle?: boolean;
}) {
  const label = identityLabel(identity);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={`Account menu, signed in as ${label.full || "owner"}`}
            title={label.full}
            className={cn(
              "inline-flex h-9 max-w-[7.5rem] min-w-0 items-center px-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-[16rem] sm:px-3",
              siteStyle
                ? "rounded-[6px] border bg-background text-foreground"
                : "rounded-md bg-foreground text-background",
            )}
          />
        }
      >
        <span className="site-mono truncate text-xs font-medium">{label.short}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <div className="flex flex-col gap-1 px-3 py-2.5">
          <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
            Signed in as {identity.ownerType ?? "no owner claim"}
          </p>
          {label.full ? (
            <div className="flex items-start gap-1">
              <p className="console-id min-w-0 flex-1 text-xs break-all">{label.full}</p>
              <CopyButton value={label.full} label="Copy signed-in identity" />
            </div>
          ) : null}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut} disabled={signingOut}>
          <HugeiconsIcon icon={Logout01Icon} className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
