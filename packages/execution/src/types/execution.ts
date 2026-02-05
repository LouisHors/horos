import { ExecutionStatus, NodeExecutionStatus } from '@horos/editor';

// 执行上下文
export interface ExecutionContext {
  executionId: string;
  workflowId: string;
  variables: Map<string, unknown>;
  nodeOutputs: Map<string, unknown>;
  startTime: Date;
  parentExecutionId?: string;
}

// 执行状态
export interface ExecutionState {
  executionId: string;
  status: ExecutionStatus;
  currentNodes: string[];  // 当前执行的节点
  completedNodes: string[];
  failedNodes: string[];
  pendingNodes: string[];
  context: ExecutionContext;
}

// 节点执行结果
export interface NodeExecutionResult {
  nodeId: string;
  status: NodeExecutionStatus;
  output?: unknown;
  error?: Error;
  duration: number;
  startTime: Date;
  endTime: Date;
}
