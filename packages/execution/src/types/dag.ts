import { WorkflowNode, WorkflowEdge } from '@horos/editor';

// DAG 节点
export interface DAGNode {
  id: string;
  node: WorkflowNode;
  dependencies: string[];  // 依赖的节点ID
  dependents: string[];    // 依赖此节点的节点ID
  level: number;           // 拓扑层级
}

// DAG 边
export interface DAGEdge {
  id: string;
  source: string;
  target: string;
  edge: WorkflowEdge;
}

// 工作流 DAG
export interface WorkflowDAG {
  id: string;
  nodes: Map<string, DAGNode>;
  edges: DAGEdge[];
  startNodes: string[];    // 没有依赖的节点
  endNodes: string[];      // 没有依赖者的节点
  levels: string[][];      // 按层级分组的节点ID
}
