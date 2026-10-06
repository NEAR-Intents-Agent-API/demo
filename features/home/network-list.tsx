import { ChainIcon, type knownChains } from "@/features/assets";
import { cn } from "@/lib/utils";

export function NetworkList({
  chains,
  layout,
  duplicate = false,
}: {
  chains: ReturnType<typeof knownChains>;
  layout: "strip" | "grid";
  duplicate?: boolean;
}) {
  return (
    <ul
      aria-label={duplicate ? undefined : "Supported networks"}
      aria-hidden={duplicate || undefined}
      className={cn(
        layout === "strip"
          ? "flex shrink-0 items-center gap-8 pr-8"
          : "grid w-full grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
        duplicate && "motion-reduce:hidden",
      )}
    >
      {chains.map((chain) => (
        <li
          key={chain.id}
          className={cn(
            "flex min-w-0 items-center gap-3 py-2 text-sm leading-5",
            layout === "strip" && "shrink-0 whitespace-nowrap",
          )}
        >
          <ChainIcon chain={chain.id} size="md" />
          <span>{chain.id === "near" ? "NEAR" : chain.name}</span>
        </li>
      ))}
    </ul>
  );
}
