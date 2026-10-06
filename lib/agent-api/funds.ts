import {
  runTool,
  type ToolContext,
  type ToolName,
  type ToolOutcome,
  toolDefinitions,
} from "@/lib/mcp/tools";

/**
 * The operations the dashboard's "Move funds" surface may call.
 *
 * This is a strict subset of the MCP toolbox: quotes, the money-moving writes and inbound deposit
 * addresses. Reads the page needs (balances, tokens, history) have their own routes. Anything not listed here
 * — including every read tool — is refused before it reaches the Agent API.
 */
export const FUNDS_TOOLS = [
  "swap_quote",
  "withdraw_preview",
  "swap",
  "withdraw",
  "intents_transfer",
  "confidential_transfer",
  "shield",
  "unshield",
  "create_cross_chain_deposit",
] as const satisfies readonly ToolName[];

export type FundsTool = (typeof FUNDS_TOOLS)[number];

export function isFundsTool(name: string): name is FundsTool {
  return (FUNDS_TOOLS as readonly string[]).includes(name);
}

/** Validates the arguments with the tool's own schema, then runs it. */
export function runFundsTool(
  name: FundsTool,
  args: Record<string, unknown>,
  context: ToolContext,
): Promise<ToolOutcome> {
  const parsed = toolDefinitions[name].inputSchema.parse(args) as Record<string, unknown>;
  return runTool(name, parsed, context);
}
