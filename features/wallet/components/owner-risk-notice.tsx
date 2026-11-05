import { Callout } from "@/components/shared/callout";

const notice =
  "This is an experimental, mainnet-only beta service. You may lose all assets you put in this wallet, or lose access to them. Keep amounts small.";

export function OwnerRiskNotice() {
  return <Callout tone="warning">{notice}</Callout>;
}
