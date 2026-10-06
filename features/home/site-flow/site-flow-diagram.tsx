import { cn } from "@/lib/utils";
import { SiteFlowNode } from "../site-flow-node";
import { FLOW_STEPS } from "./content";
import { FlowAsset } from "./flow-asset";
import styles from "./site-flow.module.css";

export function SiteFlowDiagram({ className }: { className?: string }) {
  return (
    <ol aria-label="How your agent wallet works" className={cn(styles.diagram, className)}>
      {FLOW_STEPS.map((node, index) => (
        <li key={node.id} className={styles.step}>
          <SiteFlowNode node={node} />
          {index < FLOW_STEPS.length - 1 ? (
            <span className={styles.connector} aria-hidden="true">
              <FlowAsset name="flow-arrow" width={40} height={40} className={styles.arrow} />
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
