"use client";
import { DesignAsset } from "@/components/shared/design-asset";
import { Pending } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProviderCard } from "./login-options";

export function ProviderRow({
  card,
  busy,
  disabled,
  onClick,
}: {
  card: ProviderCard;
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const primary = card.id === "passkey";
  return (
    <Button
      variant={primary ? "default" : "outline"}
      className={cn(
        "h-auto min-h-[72px] w-full justify-start gap-3 rounded-[8px] px-3 py-[14px] text-left sm:h-[72px] sm:gap-[18px] sm:px-[22px] sm:py-[13px]",
        !primary && "border-border bg-transparent",
        busy && "border-foreground",
      )}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="relative size-7 shrink-0">
        <DesignAsset
          name={card.asset}
          width={card.iconWidth}
          height={card.iconHeight}
          className={cn("absolute", card.iconPosition)}
        />
      </span>
      <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
        <span className="whitespace-normal text-sm leading-[22px] font-bold sm:text-base">
          {card.label}
        </span>
        <span
          className={cn(
            "whitespace-normal text-[13px] leading-5 font-normal normal-case sm:text-sm",
            !primary && "text-muted-foreground",
          )}
        >
          {busy ? "Waiting for your device…" : card.detail}
        </span>
      </span>
      {busy ? (
        <Pending className="shrink-0" />
      ) : (
        <DesignAsset
          name={`login-reference/login-auth-chevron${primary ? "-primary" : ""}`}
          width={16}
          height={16}
          className="shrink-0"
        />
      )}
    </Button>
  );
}
