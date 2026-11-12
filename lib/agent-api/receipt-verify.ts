import "server-only";
import {
  fetchWitnessCheckpoint,
  LogUnavailableError,
  logTileReader,
  NoteError,
  ProofError,
  ReceiptNotCoveredError,
  verifyReceipt,
} from "@near-intents-agent-api/sdk";
import { agentApi } from "@/lib/agent-api/client";
import { type ReceiptVerification, termsMismatches } from "@/lib/agent-api/receipts";
import { parseDemoEnv, parseReceiptPins } from "@/lib/config/env";

/**
 * Checks one settled execution's receipt against the pinned log and witness, never trusting the
 * Agent API for either. `receipt_not_available` and `transparency_log_disabled` come from the
 * API call and surface as ordinary errors; everything the check itself finds is a verdict.
 */
export async function verifyAgentReceipt(
  agentId: string,
  correlationId: string,
): Promise<ReceiptVerification> {
  const item = await agentApi().getReceipt(agentId, correlationId);
  if (!item.receipt) {
    return {
      status: "retry",
      reason: "This execution has no receipt in the log yet. Check again shortly.",
    };
  }
  const pins = parseReceiptPins();
  // A witness that cannot be reached or does not verify is no verdict on the receipt itself.
  let trusted: Awaited<ReturnType<typeof fetchWitnessCheckpoint>>;
  try {
    trusted = await fetchWitnessCheckpoint(
      parseDemoEnv().NEAR_INTENTS_AGENT_API_URL,
      pins.RECEIPT_LOG_ORIGIN,
      pins.RECEIPT_WITNESS_KEY,
    );
  } catch {
    return { status: "retry", reason: "The log witness could not be checked. Try again shortly." };
  }
  try {
    const verified = await verifyReceipt(item.receipt, {
      origin: pins.RECEIPT_LOG_ORIGIN,
      trusted,
      readTile: logTileReader(pins.RECEIPT_LOG_URL),
    });
    return {
      status: "verified",
      settled_at: verified.settledAt,
      leaf_index: verified.leafIndex.toString(),
      terms: verified.terms,
      mismatches: termsMismatches(item, verified.terms),
    };
  } catch (error) {
    if (error instanceof ReceiptNotCoveredError)
      return {
        status: "retry",
        reason: "The log's latest checkpoint does not cover this receipt yet. Try again shortly.",
      };
    if (error instanceof LogUnavailableError)
      return { status: "retry", reason: "The transparency log did not answer. Try again shortly." };
    if (error instanceof ProofError || error instanceof NoteError)
      return { status: "rejected", reason: error.message };
    throw error;
  }
}
