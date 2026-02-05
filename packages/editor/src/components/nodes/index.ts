import { ComponentType } from 'react';
import { StartNode } from './StartNode';
import { EndNode } from './EndNode';
import { AgentNode } from './AgentNode';
import { ToolNode } from './ToolNode';
import { ConditionNode } from './ConditionNode';

export { StartNode } from './StartNode';
export { EndNode } from './EndNode';
export { AgentNode } from './AgentNode';
export { ToolNode } from './ToolNode';
export { ConditionNode } from './ConditionNode';

// 节点类型映射 - 使用 any 避免 TypeScript 类型复杂性
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const nodeTypes: Record<string, ComponentType<any>> = {
  start: StartNode,
  end: EndNode,
  agent: AgentNode,
  tool: ToolNode,
  condition: ConditionNode,
};
