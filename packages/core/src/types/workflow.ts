export interface WorkflowNode {
  id: string;
  type: "agent" | "tool" | "condition" | "parallel" | "human";
  position: { x: number; y: number };
  data: {
    label?: string;
    agentId?: string;
    toolId?: string;
    condition?: string;
    config?: Record<string, any>;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

export interface WorkflowConfig {
  maxConcurrency: number;
  timeout: number;
  retryPolicy: {
    maxAttempts: number;
    backoffType: "fixed" | "exponential" | "linear";
  };
}

export type ExecutionStatus =
  | "pending"
  | "running"
  | "paused"
  | "waiting_for_human"
  | "completed"
  | "failed"
  | "cancelled"
  | "timeout";

export interface NodeExecutionState {
  nodeId: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}
