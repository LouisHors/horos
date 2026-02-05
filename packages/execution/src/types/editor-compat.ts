/**
 * 编辑器类型兼容性定义
 * 执行引擎内部使用的类型枚举
 */

/** 节点类型 */
export enum NodeType {
  START = 'start',
  END = 'end',
  AGENT = 'agent',
  TOOL = 'tool',
  CONDITION = 'condition',
  LOOP = 'loop',
  DELAY = 'delay',
  WEBHOOK = 'webhook',
  CODE = 'code',
}

/** 节点执行状态 */
export enum NodeExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  CANCELLED = 'cancelled',
}

/** 执行状态 */
export enum ExecutionStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}
