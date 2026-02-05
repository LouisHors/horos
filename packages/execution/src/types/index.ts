// DAG Types
export * from './dag';

// Execution Types
export interface ExecutionConfig {
  /** 执行模式 */
  mode: 'sequential' | 'parallel';
  /** 最大并行数 */
  maxParallelism: number;
  /** 超时时间(ms) */
  timeout: number;
  /** 重试次数 */
  maxRetries: number;
  /** 断点调试 */
  debug: boolean;
  /** 检查点间隔 */
  checkpointInterval: number;
}

export interface ExecutionContext {
  executionId: string;
  workflowId: string;
  variables: Map<string, unknown>;
  nodeOutputs: Map<string, unknown>;
  startTime: Date;
}

export interface ExecutionState {
  executionId: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  currentNodes: string[];
  completedNodes: string[];
  failedNodes: string[];
  pendingNodes: string[];
  context: ExecutionContext;
}

export interface ExecutionError {
  nodeId: string;
  error: Error;
  recoverable: boolean;
}

export interface ExecutionResult {
  success: boolean;
  executionId: string;
  status: string;
  outputs: Map<string, unknown>;
  errors: ExecutionError[];
  duration: number;
}
