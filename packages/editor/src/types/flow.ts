import { CanvasState } from './node';

// 流程定义
export interface FlowDefinition {
  id: string;
  name: string;
  description?: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  canvas: CanvasState;
}

// 流程执行状态
export enum ExecutionStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// 节点执行状态
export enum NodeExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error',
  SKIPPED = 'skipped',
}

// 历史记录条目
export interface HistoryEntry {
  id: string;
  timestamp: number;
  type: 'node' | 'edge' | 'property' | 'layout';
  action: 'add' | 'delete' | 'update' | 'move';
  data: unknown;
  previousState?: unknown;
}

// 剪贴板数据
export interface ClipboardData {
  nodes: CanvasState['nodes'];
  edges: CanvasState['edges'];
  timestamp: number;
}
