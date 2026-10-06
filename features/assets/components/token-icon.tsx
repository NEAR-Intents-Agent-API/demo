"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { chainInfo } from "../chains";
import { tokenLogoUrl } from "../tokens";

/**
 * Round artwork for a token or a chain.
 *
 * The artwork is decoration, never evidence: it can be slow, blocked or missing, so every icon
 * has a monogram it degrades to, and nothing about layout depends on the image loading.
 */

const SIZES = {
  xs: "size-4 text-[8px]",
  sm: "size-6 text-[10px]",
  md: "size-8 text-xs",
  lg: "size-10 text-sm",
  xl: "size-14 text-base",
} as const;
type IconSize = keyof typeof SIZES;

const BADGE_SIZES: Record<IconSize, string> = {
  xs: "size-2",
  sm: "size-3",
  md: "size-3.5",
  lg: "size-4",
  xl: "size-5",
};

/** Stable hue per label, so a missing logo is still recognisable next time it appears. */
function hueOf(label: string): number {
  let hash = 0;
  for (const char of label) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return hash;
}

function Monogram({ label, className }: { label: string; className?: string }) {
  const hue = hueOf(label);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-semibold uppercase select-none",
        className,
      )}
      style={{
        backgroundColor: `oklch(0.93 0.05 ${hue})`,
        color: `oklch(0.38 0.09 ${hue})`,
      }}
    >
      {label.trim().slice(0, 1) || "?"}
    </span>
  );
}

function Artwork({
  src,
  label,
  className,
}: {
  src: string | null;
  label: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  // An image that failed before React attached `onError` (server-rendered HTML) never fires it
  // again, so a settled-but-empty image is checked once, as soon as it mounts.
  const settle = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth === 0) setFailed(true);
  }, []);
  if (!src || failed) return <Monogram label={label} className={className} />;
  return (
    // biome-ignore lint/performance/noImgElement: third-party logo CDNs, sized by CSS; next/image would proxy every host
    <img
      ref={settle}
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      draggable={false}
      onError={() => setFailed(true)}
      className={cn("shrink-0 rounded-full bg-white object-cover ring-1 ring-black/10", className)}
    />
  );
}

export function ChainIcon({
  chain,
  size = "md",
  className,
}: {
  chain: string;
  size?: IconSize;
  className?: string;
}) {
  const info = chainInfo(chain);
  return <Artwork src={info.logo} label={info.name} className={cn(SIZES[size], className)} />;
}

/**
 * A token with the chain it lives on pinned to its corner. Pass no `chain` for a bare token.
 * The same symbol on two chains is two different assets, and the badge is what says which.
 */
export function TokenIcon({
  assetId,
  symbol,
  chain,
  size = "md",
  className,
}: {
  assetId?: string | null;
  symbol?: string | null;
  chain?: string | null;
  size?: IconSize;
  className?: string;
}) {
  const label = symbol || assetId || "?";
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <Artwork src={tokenLogoUrl(assetId, symbol)} label={label} className={SIZES[size]} />
      {chain ? (
        <span
          className={cn(
            "absolute -right-0.5 -bottom-0.5 rounded-full bg-card p-px ring-1 ring-border",
          )}
        >
          <ChainIcon chain={chain} className={BADGE_SIZES[size]} size="xs" />
        </span>
      ) : null}
    </span>
  );
}

/** Overlapping row of chain icons: "reachable on these networks" in one glance. */
export function ChainStack({
  chains,
  max = 5,
  size = "sm",
  className,
}: {
  chains: readonly string[];
  max?: number;
  size?: IconSize;
  className?: string;
}) {
  const shown = chains.slice(0, max);
  const rest = chains.length - shown.length;
  return (
    <span className={cn("inline-flex items-center", className)}>
      {shown.map((chain, index) => (
        <span
          key={chain}
          className={cn("rounded-full ring-2 ring-card", index > 0 && "-ml-1.5")}
          title={chainInfo(chain).name}
        >
          <ChainIcon chain={chain} size={size} />
        </span>
      ))}
      {rest > 0 ? (
        <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">+{rest}</span>
      ) : null}
    </span>
  );
}
