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
}: {
  lane: Lane;
  holdings: readonly Holding[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  account: string | undefined;
}) {
  return (
    <>
      <PortfolioBody
        lane={lane}
        visible={holdings.filter((holding) => holding.raw > 0n)}
        loading={loading}
        error={error}
        onRetry={onRetry}
      />
      {account ? <AccountFooter account={account} /> : null}
    </>
  );
}
