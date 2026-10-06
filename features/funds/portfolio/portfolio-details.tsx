import type { Catalog } from "@/features/assets";
import { usdValue } from "@/features/assets";
import type { Holding } from "../use-funds";
import { AccountFooter } from "./account-footer";
import type { Lane } from "./portfolio";
import { PortfolioBody } from "./portfolio-body";

export function PortfolioDetails({
  lane,
  holdings,
  loading,
  error,
  onRetry,
  account,
  catalog,
}: {
  lane: Lane;
  holdings: readonly Holding[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  account: string | undefined;
  catalog: Catalog;
}) {
  return (
    <>
      <PortfolioBody
        lane={lane}
        visible={holdings.filter((holding) => holding.raw > 0n)}
        loading={loading}
        error={error}
        onRetry={onRetry}
        usdOf={(holding) => {
          const token = catalog.find(holding.assetId);
          return token ? usdValue(holding.raw, token) : null;
        }}
      />
      {account ? <AccountFooter account={account} /> : null}
    </>
  );
}
