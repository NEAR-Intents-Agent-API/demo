import { ChainIcon } from "@/features/assets";
import { FLOW_CHAINS } from "./content";
import { FlowAsset } from "./flow-asset";
import styles from "./site-flow.module.css";

export function FlowNetworkIllustration() {
  return (
    <div className={styles.visual}>
      <div className={styles.network}>
        <FlowAsset name="flow-network-routes" width={300} height={275} className={styles.routes} />
        <ul aria-label="Examples of supported networks">
          {FLOW_CHAINS.map((chain) => (
            <li key={chain.id} className={styles.networkLogo} title={chain.name}>
              <ChainIcon chain={chain.id} size="lg" className={styles.chainIcon} />
              <span className="sr-only">{chain.name}</span>
            </li>
          ))}
          <li className={`${styles.networkLogo} ${styles.networkCenter}`} title="NEAR">
            <ChainIcon chain="near" size="xl" className={styles.centerIcon} />
            <span className="sr-only">NEAR</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
