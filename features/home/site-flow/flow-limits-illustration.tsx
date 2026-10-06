import Image from "next/image";
import { FLOW_TOKENS } from "./content";
import { FlowAsset } from "./flow-asset";
import styles from "./site-flow.module.css";

export function FlowLimitsIllustration() {
  return (
    <div
      className={styles.limits}
      role="img"
      aria-label="Example limits: USDC, ETH and BTC tokens, a budget, and approved destinations"
    >
      <div className={styles.setting} aria-hidden="true">
        <span className={styles.label}>Tokens</span>
        <span className={styles.logos}>
          {FLOW_TOKENS.map((symbol) => (
            <Image
              key={symbol}
              src={`/assets/figma/flow-token-${symbol.toLowerCase()}.png`}
              width={32}
              height={32}
              alt=""
              unoptimized
              className={styles.tokenLogo}
            />
          ))}
        </span>
        <FlowAsset name="flow-chevron" width={20} height={20} className={styles.chevron} />
      </div>
      <div className={styles.setting} aria-hidden="true">
        <span className={styles.label}>Budget</span>
        <FlowAsset name="flow-budget" width={150} height={30} className={styles.budget} />
      </div>
      <div className={styles.setting} aria-hidden="true">
        <span className={styles.label}>Destinations</span>
        <FlowAsset
          name="flow-destinations"
          width={128}
          height={32}
          className={styles.destinations}
        />
        <FlowAsset name="flow-chevron" width={20} height={20} className={styles.chevron} />
      </div>
    </div>
  );
}
