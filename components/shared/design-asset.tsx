import Image from "next/image";
import { cn } from "@/lib/utils";
import { designAssetIconColor } from "./design-asset-utils";

/** Original design exports; each caller owns the asset's display slot. */
export function DesignAsset({
  name,
  width = 20,
  height = 20,
  alt = "",
  className,
}: {
  name: string;
  width?: number;
  height?: number;
  alt?: string;
  className?: string;
}) {
  const iconColor = designAssetIconColor(name);
  if (iconColor)
    return (
      <span
        role="img"
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={cn("inline-block shrink-0 bg-current", iconColor, className)}
        style={{
          width,
          height,
          mask: `url("/assets/figma/${name}.svg") center / contain no-repeat`,
        }}
      />
    );
  return (
    <Image
      src={`/assets/figma/${name}.svg`}
      width={width}
      height={height}
      alt={alt}
      className={className}
      unoptimized
    />
  );
}
