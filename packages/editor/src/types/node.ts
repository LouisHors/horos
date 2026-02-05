import { Node, Edge } from '@xyflow/react';

// 节点类型枚举
export enum NodeType {
  START = 'start',
  END = 'end',
  AGENT = 'agent',
  TOOL = 'tool',
  CONDITION = 'condition',
}

// 基础节点数据
export interface BaseNodeData extends Record<string, unknown> {
  label: string;
  description?: string;
  config?: Record<string, unknown>;
}

// Agent 节点数据
export interface AgentNodeData extends BaseNodeData {
  type: NodeType.AGENT;
  agentId?: string;
  model?: string;
  systemPrompt?: string;
  temperature?: number;
}

// 工具节点数据
export interface ToolNodeData extends BaseNodeData {
  type: NodeType.TOOL;
  toolName?: string;
  toolConfig?: Record<string, unknown>;
}

// 条件节点数据
export interface ConditionNodeData extends BaseNodeData {
  type: NodeType.CONDITION;
  condition?: string;
  branches?: { label: string; condition: string }[];
}

// 开始节点数据
export interface StartNodeData extends BaseNodeData {
  type: NodeType.START;
  initialContext?: Record<string, unknown>;
}

// 结束节点数据
export interface EndNodeData extends BaseNodeData {
  type: NodeType.END;
  outputMapping?: Record<string, string>;
}

// 联合类型
export type WorkflowNodeData =
  | AgentNodeData
  | ToolNodeData
  | ConditionNodeData
  | StartNodeData
  | EndNodeData;

// 工作流节点
export type WorkflowNode = Node<WorkflowNodeData>;

// 工作流边
export type WorkflowEdge = Edge;

// 节点定义（用于注册表）
export interface NodeDefinition {
  type: NodeType | string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  component: React.ComponentType<any>;
  defaultData: Partial<WorkflowNodeData>;
  schema?: object; // JSON Schema for properties
  inputs?: NodeHandle[];
  outputs?: NodeHandle[];
}

// 节点连接点
export interface NodeHandle {
  id: string;
  label?: string;
  type: 'source' | 'target';
  position: 'left' | 'right' | 'top' | 'bottom';
  required?: boolean;
}

// 画布状态
export interface CanvasState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodes: string[];
  selectedEdges: string[];
}
