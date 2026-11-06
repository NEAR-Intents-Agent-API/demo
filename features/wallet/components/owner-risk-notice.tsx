import { Callout } from "@/components/shared/callout";
import { ownerRiskNotice } from "@/lib/owner-risk-notice";

export function OwnerRiskNotice() {
  return <Callout tone="warning">{ownerRiskNotice}</Callout>;
}
