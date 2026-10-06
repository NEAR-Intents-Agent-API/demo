import type { FlowStep } from "./site-flow/content";
import { FlowIllustration } from "./site-flow/flow-illustration";
import styles from "./site-flow/site-flow.module.css";

export function SiteFlowNode({ node }: { node: FlowStep }) {
  return (
    <article className={styles.card}>
      <p className={styles.number}>{node.step}</p>
      <h3 className={styles.title}>{node.title}</h3>
      <p className={styles.description}>{node.description}</p>
      <FlowIllustration step={node.id} />
    </article>
  );
}
