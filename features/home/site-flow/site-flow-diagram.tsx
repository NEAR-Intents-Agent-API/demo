"use client";

import { cn } from "@/lib/utils";
import { SiteFlowNode } from "../site-flow-node";
import { useNetworks } from "../use-networks";
import { flowSteps } from "./content";
import { FlowAsset } from "./flow-asset";
import styles from "./site-flow.module.css";

export function SiteFlowDiagram({ className }: { className?: string }) {
  const steps = flowSteps(useNetworks().count);
  return (
    <ol aria-label="How your agent account works" className={cn(styles.diagram, className)}>
      {steps.map((node, index) => (
        <li key={node.id} className={styles.step}>
          <SiteFlowNode node={node} />
          {index < steps.length - 1 ? (
            <span className={styles.connector} aria-hidden="true">
              <FlowAsset name="flow-arrow" width={40} height={40} className={styles.arrow} />
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
