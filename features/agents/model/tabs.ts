export const AGENT_TABS = ["rules", "activity", "funds"] as const;
export type AgentTab = (typeof AGENT_TABS)[number];
export const DEFAULT_AGENT_TAB: AgentTab = "rules";
export type AccountSetupStep = "live" | "fund" | "access" | "connect";

export function allowedSetupStep(value: string | null): AccountSetupStep | null {
  return value === "live" || value === "fund" || value === "access" || value === "connect"
    ? value
    : null;
}

export function allowedTab(value: string | null | undefined): AgentTab {
  return AGENT_TABS.includes(value as AgentTab) ? (value as AgentTab) : DEFAULT_AGENT_TAB;
}

export function agentTabUrl(pathname: string, search: string, tab: AgentTab): string {
  if (tab === "funds") return agentFundsUrl(pathname, search, true);
  const params = new URLSearchParams(search);
  params.set("tab", tab);
  params.delete("setup");
  params.delete("funds");
  return `${pathname}?${params.toString()}`;
}

export function agentFundsUrl(pathname: string, search: string, open: boolean): string {
  const params = new URLSearchParams(search);
  const tab = allowedTab(params.get("tab"));
  params.set("tab", tab === "funds" ? DEFAULT_AGENT_TAB : tab);
  params.delete("setup");
  if (open) params.set("funds", "1");
  else params.delete("funds");
  return `${pathname}?${params.toString()}`;
}

export function agentSetupUrl(pathname: string, search: string, step: AccountSetupStep): string {
  const params = new URLSearchParams(search);
  const tab = allowedTab(params.get("tab"));
  params.set("tab", tab === "funds" ? DEFAULT_AGENT_TAB : tab);
  params.delete("funds");
  params.set("setup", step);
  return `${pathname}?${params.toString()}`;
}
