import { DesignAsset } from "@/components/shared/design-asset";
import { cn } from "@/lib/utils";
import styles from "./site-flow.module.css";

export function FlowAsset({
  name,
  width,
  height,
  className,
}: {
  name: string;
  width: number;
  height: number;
  className?: string;
}) {
  return (
    <>
      <DesignAsset
        name={`${name}-light`}
        width={width}
        height={height}
        className={cn(className, styles.lightAsset)}
      />
      <DesignAsset
        name={name}
        width={width}
        height={height}
        className={cn(className, styles.darkAsset)}
      />
    </>
  );
}
