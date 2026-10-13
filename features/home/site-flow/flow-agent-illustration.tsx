import { FLOW_ACTIONS } from "./content";
import { FlowAsset } from "./flow-asset";
import styles from "./site-flow.module.css";

export function FlowAgentIllustration() {
  return (
    <div className={styles.agent}>
      <FlowAsset name="flow-agent" width={240} height={190} className={styles.agentIcon} />
      <ul className={styles.actions} aria-label="Available agent actions">
        {FLOW_ACTIONS.map((action) => (
          <li key={action.label} className={styles.action}>
            <FlowAsset name={action.asset} width={20} height={20} className={styles.actionIcon} />
            <span>{action.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
