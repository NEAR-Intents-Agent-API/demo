"use client";
import { useState } from "react";
import type { McpClientView } from "../api";
import { useMcpAuthorization } from "./use-mcp-authorization";

export function useMcpKeyForm(agentId: string, client?: McpClientView) {
  const [name, setName] = useState(client?.name ?? "");
  const authorize = useMcpAuthorization(agentId);
  return { name, setName, authorize };
}
