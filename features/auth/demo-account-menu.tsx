"use client";
import { Logout01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { MonoId } from "@/components/shared/identifiers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Account"
            className={cn(
              "grid size-9 place-items-center text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring",
              siteStyle
                ? "rounded-[6px] border bg-background text-[13px] font-medium text-foreground"
                : "rounded-md bg-foreground text-background",
            )}
          />
        }
      >
        {(identity.ownerLabel ?? identity.name).trim().charAt(0).toUpperCase() || "?"}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <div className="flex flex-col gap-1 px-3 py-2.5">
          <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
            Signed in as {identity.ownerType ?? "no owner claim"}
          </p>
          {identity.ownerLabel ? (
            <MonoId value={identity.ownerLabel} className="text-xs" head={12} tail={6} />
          ) : (
            <p className="truncate text-sm">{identity.name}</p>
          )}
          {identity.ownerLabel === identity.name ? null : (
            <p className="truncate text-xs text-muted-foreground" title={identity.email}>
              {identity.email}
            </p>
          )}
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
