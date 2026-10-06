import type { AgentView } from "@near-intents-agent-api/sdk";
import { shortId } from "@/components/shared/identifiers";

/** Searchable account rows preserve the exact agent selected by the user. */

/** How many rows of each live collection the palette shows; the rest stay searchable by page. */
export const ROW_LIMIT = 12;

export type PaletteRow = {
  id: string;
  label: string;
  /** cmdk match text: the visible label plus the identifiers a visitor may paste. */
  value: string;
  detail: string;
  path: string;
};

export function agentRows(agents: AgentView[]): PaletteRow[] {
  return agents.slice(0, ROW_LIMIT).map((agent) => ({
    id: agent.id,
    label: agent.name,
    value: `${agent.name} ${agent.id} ${agent.owner?.type ?? "unbound"}`,
    detail: shortId(agent.id, 8, 4),
    path: `/agents/${agent.id}`,
  }));
}
