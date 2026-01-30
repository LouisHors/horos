export interface LLMConfig {
  provider: "openai" | "anthropic" | "azure" | "local";
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export interface AgentConfig {
  id?: string;
  name: string;
  role: string;
  description?: string;
  llmConfig: LLMConfig;
  tools: string[];
  mcpServers?: string[];
}

export type AgentStatus =
  | "idle"
  | "running"
  | "paused"
  | "error"
  | "terminated";

export interface AgentRuntimeState {
  agentId: string;
  status: AgentStatus;
  currentGroupId?: string;
  currentTask?: string;
  tokenUsage: number;
  messageCount: number;
}
