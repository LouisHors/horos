import { WorkflowNode, DAGNode } from './dag';
import { NodeExecutionStatus } from './editor-compat';

/** 节点执行结果 */
export interface NodeExecutionResult {
  nodeId: string;
  status: NodeExecutionStatus;
  output?: unknown;
  error?: Error;
  startTime: Date;
  endTime: Date;
}

/** 执行上下文 */
export interface ExecutionContext {
  executionId: string;
  workflowId: string;
  variables: Map<string, unknown>;
  nodeOutputs: Map<string, unknown>;
  startTime: Date;
}

/** 执行配置 */
export interface ExecutionConfig {
  executionMode: 'sequential' | 'parallel';
  maxParallelism: number;
  timeout: number;
  maxRetries: number;
  debug: boolean;
  checkpointInterval: number;
}

/** 执行状态 */
export interface ExecutionState {
  executionId: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  currentNodes: string[];
  completedNodes: string[];
  failedNodes: string[];
  pendingNodes: string[];
  context: ExecutionContext;
}

/** 执行错误 */
export interface ExecutionError {
  nodeId: string;
  error: Error;
  recoverable: boolean;
}

/** 执行结果 */
export interface ExecutionResult {
  success: boolean;
  executionId: string;
  status: string;
  outputs: Map<string, unknown>;
  errors: ExecutionError[];
  duration: number;
}

/** 执行事件 */
export interface ExecutionEvent {
  type: 'nodeStart' | 'nodeComplete' | 'nodeError' | 'executionComplete' | 'executionError';
  executionId: string;
  nodeId?: string;
  data?: unknown;
  error?: Error;
  timestamp: Date;
}

/** 执行器接口 */
export interface NodeExecutor {
  execute(node: DAGNode, context: ExecutionContext, engine: any): Promise<unknown>;
}
