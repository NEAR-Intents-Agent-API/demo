"use client";

import { AgentsPage } from "./agents-page";
import { CreateAccountDialog } from "./components/create-agent/create-account-dialog";

export function CreateAgentPage() {
  return (
    <>
      <AgentsPage />
      <CreateAccountDialog />
    </>
  );
}
