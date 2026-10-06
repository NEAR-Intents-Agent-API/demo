import type { FlowStep } from "./content";
import { FlowAgentIllustration } from "./flow-agent-illustration";
import { FlowAsset } from "./flow-asset";
import { FlowLimitsIllustration } from "./flow-limits-illustration";
import { FlowNetworkIllustration } from "./flow-network-illustration";
import styles from "./site-flow.module.css";

export function FlowIllustration({ step }: { step: FlowStep["id"] }) {
  if (step === "limits") return <FlowLimitsIllustration />;
  if (step === "execute") return <FlowAgentIllustration />;
  if (step === "networks") return <FlowNetworkIllustration />;
  return (
    <div className={styles.visual} aria-hidden="true">
      <FlowAsset name="flow-owner" width={300} height={275} className={styles.owner} />
    </div>
  );
}
