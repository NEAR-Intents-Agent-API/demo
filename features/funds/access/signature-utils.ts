import type { GenerateIntentResponse } from "@near-intents-agent-api/sdk";
import type { ConsentStage } from "@/features/wallet";

/** Same signing stages for grants and whitelist updates. */
export function signatureLabel(stage: ConsentStage, idle: string): string {
  if (stage === "preparing") return "Preparing permission…";
  if (stage === "signing") return "Confirm in your wallet…";
  if (stage === "submitting") return "Saving permission…";
  return idle;
}

/** The message an owner signs, unpacked so the summary can decode it; other standards show their payload. */
export function signedPayloadText(intent: GenerateIntentResponse["intent"]): string {
  if (intent.standard === "nep413") return intent.payload.message;
  if (intent.standard === "eip712" && typeof intent.payload.message.payload === "string")
    return intent.payload.message.payload;
  return JSON.stringify(intent.payload, null, 2);
}
