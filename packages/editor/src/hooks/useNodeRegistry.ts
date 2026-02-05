import { useMemo, useCallback } from 'react';
import { NodeRegistry } from '../core/NodeRegistry';
import { NodeDefinition, NodeType } from '../types';

// 默认节点定义
const defaultNodes: Omit<NodeDefinition, 'component'>[] = [
  {
    type: NodeType.START,
    name: 'Start',
    description: 'Workflow entry point',
    category: 'Flow Control',
    icon: 'play',
    defaultData: { label: 'Start' },
  },
  {
    type: NodeType.END,
    name: 'End',
    description: 'Workflow exit point',
    category: 'Flow Control',
    icon: 'square',
    defaultData: { label: 'End' },
  },
  {
    type: NodeType.AGENT,
    name: 'Agent',
    description: 'AI agent for conversation and reasoning',
    category: 'AI',
    icon: 'bot',
    defaultData: { 
      label: 'Agent', 
      model: 'gpt-4',
      temperature: 0.7,
      systemPrompt: '' 
    },
  },
  {
    type: NodeType.TOOL,
    name: 'Tool',
    description: 'External tool or function call',
    category: 'Tools',
    icon: 'wrench',
    defaultData: { label: 'Tool', toolName: '', toolConfig: {} },
  },
  {
    type: NodeType.CONDITION,
    name: 'Condition',
    description: 'Conditional branching based on expression',
    category: 'Flow Control',
    icon: 'git-branch',
    defaultData: { 
      label: 'Condition', 
      condition: '',
      branches: [
        { label: 'True', condition: 'true' },
        { label: 'False', condition: 'false' },
      ]
    },
  },
];

export interface UseNodeRegistryOptions {
  customNodes?: Omit<NodeDefinition, 'component'>[];
}

export function useNodeRegistry(options: UseNodeRegistryOptions = {}) {
  const registry = useMemo(() => {
    const reg = new NodeRegistry();
    
    // Register default nodes
    defaultNodes.forEach(node => {
      reg.register(node as NodeDefinition);
    });
    
    // Register custom nodes
    options.customNodes?.forEach(node => {
      reg.register(node as NodeDefinition);
    });
    
    return reg;
  }, [options.customNodes]);

  const categories = useMemo(() => registry.getCategories(), [registry]);
  
  const allNodes = useMemo(() => registry.getAll(), [registry]);

  const getNodesByCategory = useCallback(
    (category: string) => registry.getByCategory(category),
    [registry]
  );

  const searchNodes = useCallback(
    (query: string) => registry.search(query),
    [registry]
  );

  const getNodeData = useCallback(
    (type: string) => {
      try {
        return registry.createNodeData(type);
      } catch {
        return { label: type };
      }
    },
    [registry]
  );

  const onDragStart = useCallback((event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  return {
    registry,
    categories,
    allNodes,
    getNodesByCategory,
    searchNodes,
    getNodeData,
    onDragStart,
  };
}

export default useNodeRegistry;
