"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  type AccountSetupStep,
  agentFundsUrl,
  agentSetupUrl,
  agentTabUrl,
  allowedSetupStep,
  allowedTab,
  DEFAULT_AGENT_TAB,
} from "../../model/tabs";

/** Native history integrates with Next search params without repeating the ownership fetch. */
export function useAgentTab(accountPath?: string) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const requestedTab = allowedTab(params.get("tab"));
  const tab = accountPath || requestedTab === "funds" ? DEFAULT_AGENT_TAB : requestedTab;
  const setup = accountPath ? "access" : allowedSetupStep(params.get("setup"));
  const fundsOpen =
    !accountPath && !setup && (params.get("funds") === "1" || requestedTab === "funds");
  const navigate = (url: string, changePage = false) => {
    if (accountPath || changePage) router.push(url);
    else window.history.pushState(null, "", url);
  };
  const openFunds = () => navigate(agentFundsUrl(accountPath ?? pathname, params.toString(), true));
  const closeFunds = () => {
    window.history.replaceState(null, "", agentFundsUrl(pathname, params.toString(), false));
  };
  const setTab = (value: string) => {
    const next = allowedTab(value);
    if (next === "funds") {
      openFunds();
      return;
    }
    if (next === tab && !setup && !fundsOpen && !accountPath) return;
    navigate(agentTabUrl(accountPath ?? pathname, params.toString(), next));
  };
  const setSetupStep = (step: AccountSetupStep) =>
    navigate(agentSetupUrl(accountPath ?? pathname, params.toString(), step));
  const closeSetup = () => {
    const url = agentTabUrl(accountPath ?? pathname, params.toString(), tab);
    if (accountPath) router.replace(url);
    else window.history.replaceState(null, "", url);
  };
  return { tab, setTab, setup, setSetupStep, closeSetup, fundsOpen, openFunds, closeFunds };
}
