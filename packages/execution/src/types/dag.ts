/**
 * DAG (有向无环图) 类型定义
 */

/** DAG 节点 */
export interface DAGNode {
  id: string;
  type: string;
  data: Record<string, unknown>;
  inputs: string[];
  outputs: string[];
}

/** DAG 边 */
export interface DAGEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

/** DAG 结构 */
export interface DAG {
  nodes: DAGNode[];
  edges: DAGEdge[];
  executionOrder: string[][];  // 分层执行顺序
}

/** 工作流节点 */
export interface WorkflowNode {
  id: string;
  type: string;
  data: Record<string, unknown>;
  position: { x: number; y: number };
}

/** 工作流边 */
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}
