import type { ConsentStage } from "@/features/wallet";

/** Same signing stages for grants and whitelist updates. */
export function signatureLabel(stage: ConsentStage, idle: string): string {
  if (stage === "preparing") return "Preparing permission…";
  if (stage === "signing") return "Confirm in your wallet…";
  if (stage === "submitting") return "Saving permission…";
  return idle;
}
