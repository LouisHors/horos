import { useCallback, useMemo } from 'react';
import { Connection, NodeChange, EdgeChange } from '@xyflow/react';
import { useFlowStore } from '../stores/flowStore';
import { 
  WorkflowNode, 
  WorkflowEdge, 
  NodeType,
  StartNodeData,
  EndNodeData,
  AgentNodeData,
  ToolNodeData,
  ConditionNodeData,
} from '../types';
import { nanoid } from '../utils/cn';

// 节点创建配置
export interface CreateNodeConfig {
  type: NodeType;
  position: { x: number; y: number };
  data?: Record<string, unknown>;
  label?: string;
}

// 节点更新配置
export interface UpdateNodeConfig {
  nodeId: string;
  data: Partial<WorkflowNode['data']>;
}

// 边创建配置
export interface CreateEdgeConfig {
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  label?: string;
}

// useFlowState Hook 返回值
export interface UseFlowStateReturn {
  // 状态
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodes: string[];
  selectedEdges: string[];
  reactFlowInstance: any | null;
  
  // 计算属性
  hasSelection: boolean;
  selectedNodeCount: number;
  selectedEdgeCount: number;
  nodeCount: number;
  edgeCount: number;
  
  // 节点操作
  addNode: (config: CreateNodeConfig) => WorkflowNode;
  updateNode: (nodeId: string, data: Partial<WorkflowNode['data']>) => void;
  updateNodeConfig: (config: UpdateNodeConfig) => void;
  removeNode: (nodeId: string) => void;
  removeNodes: (nodeIds: string[]) => void;
  getNode: (nodeId: string) => WorkflowNode | undefined;
  getNodeByType: (type: NodeType) => WorkflowNode[];
  
  // 边操作
  addEdge: (config: CreateEdgeConfig) => WorkflowEdge;
  removeEdge: (edgeId: string) => void;
  removeEdges: (edgeIds: string[]) => void;
  getEdge: (edgeId: string) => WorkflowEdge | undefined;
  getEdgesBySource: (sourceId: string) => WorkflowEdge[];
  getEdgesByTarget: (targetId: string) => WorkflowEdge[];
  
  // 选中操作
  selectNode: (nodeId: string, multi?: boolean) => void;
  selectNodes: (nodeIds: string[]) => void;
  selectEdge: (edgeId: string, multi?: boolean) => void;
  deselectNode: (nodeId: string) => void;
  deselectEdge: (edgeId: string) => void;
  clearSelection: () => void;
  isNodeSelected: (nodeId: string) => boolean;
  isEdgeSelected: (edgeId: string) => boolean;
  getSelectedNodes: () => WorkflowNode[];
  getSelectedEdges: () => WorkflowEdge[];
  
  // 批量操作
  removeSelected: () => void;
  duplicateNodes: (nodeIds: string[]) => WorkflowNode[];
  
  // 画布操作
  setReactFlowInstance: (instance: any) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  
  // 序列化
  toObject: () => { nodes: WorkflowNode[]; edges: WorkflowEdge[] };
  fromObject: (data: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }) => void;
  reset: () => void;
}

// 生成唯一 ID
const generateId = () => `node_${nanoid()}`;

export const useFlowState = (): UseFlowStateReturn => {
  const store = useFlowStore();

  // 计算属性
  const hasSelection = store.selectedNodes.length > 0 || store.selectedEdges.length > 0;
  const selectedNodeCount = store.selectedNodes.length;
  const selectedEdgeCount = store.selectedEdges.length;
  const nodeCount = store.nodes.length;
  const edgeCount = store.edges.length;

  // 添加节点
  const addNode = useCallback((config: CreateNodeConfig): WorkflowNode => {
    const id = generateId();
    const baseData = { label: config.label || config.type, ...config.data };
    
    // 根据节点类型创建正确的 data 结构
    let nodeData: WorkflowNode['data'];
    switch (config.type) {
      case NodeType.START:
        nodeData = { type: NodeType.START, ...baseData } as StartNodeData;
        break;
      case NodeType.END:
        nodeData = { type: NodeType.END, ...baseData } as EndNodeData;
        break;
      case NodeType.AGENT:
        nodeData = { type: NodeType.AGENT, model: 'gpt-4', temperature: 0.7, ...baseData } as AgentNodeData;
        break;
      case NodeType.TOOL:
        nodeData = { type: NodeType.TOOL, toolName: '', ...baseData } as ToolNodeData;
        break;
      case NodeType.CONDITION:
        nodeData = { type: NodeType.CONDITION, condition: '', ...baseData } as ConditionNodeData;
        break;
      default:
        nodeData = baseData as WorkflowNode['data'];
    }
    
    const node: WorkflowNode = {
      id,
      type: config.type,
      position: config.position,
      data: nodeData,
    };
    store.addNode(node);
    return node;
  }, [store]);

  // 批量更新节点配置
  const updateNodeConfig = useCallback((config: UpdateNodeConfig) => {
    store.updateNode(config.nodeId, config.data);
  }, [store]);

  // 获取特定类型的节点
  const getNodeByType = useCallback((type: NodeType): WorkflowNode[] => {
    return store.nodes.filter((node) => node.type === type);
  }, [store.nodes]);

  // 添加边
  const addEdge = useCallback((config: CreateEdgeConfig): WorkflowEdge => {
    const id = `e-${config.source}-${config.sourceHandle || 'out'}-${config.target}-${config.targetHandle || 'in'}`;
    const edge: WorkflowEdge = {
      id,
      source: config.source,
      target: config.target,
      sourceHandle: config.sourceHandle,
      targetHandle: config.targetHandle,
      type: 'custom',
      animated: true,
      label: config.label,
    };
    store.addEdge(edge);
    return edge;
  }, [store]);

  // 获取从某节点出发的边
  const getEdgesBySource = useCallback((sourceId: string): WorkflowEdge[] => {
    return store.edges.filter((edge) => edge.source === sourceId);
  }, [store.edges]);

  // 获取指向某节点的边
  const getEdgesByTarget = useCallback((targetId: string): WorkflowEdge[] => {
    return store.edges.filter((edge) => edge.target === targetId);
  }, [store.edges]);

  // 选择节点 (支持多选)
  const selectNode = useCallback((nodeId: string, multi = false) => {
    if (multi) {
      const current = store.selectedNodes;
      if (current.includes(nodeId)) {
        store.setSelectedNodes(current.filter((id) => id !== nodeId));
      } else {
        store.setSelectedNodes([...current, nodeId]);
      }
    } else {
      store.setSelectedNodes([nodeId]);
      store.setSelectedEdges([]);
    }
  }, [store]);

  // 选择多个节点
  const selectNodes = useCallback((nodeIds: string[]) => {
    store.setSelectedNodes(nodeIds);
  }, [store]);

  // 选择边
  const selectEdge = useCallback((edgeId: string, multi = false) => {
    if (multi) {
      const current = store.selectedEdges;
      if (current.includes(edgeId)) {
        store.setSelectedEdges(current.filter((id) => id !== edgeId));
      } else {
        store.setSelectedEdges([...current, edgeId]);
      }
    } else {
      store.setSelectedEdges([edgeId]);
      store.setSelectedNodes([]);
    }
  }, [store]);

  // 取消选择节点
  const deselectNode = useCallback((nodeId: string) => {
    store.setSelectedNodes(store.selectedNodes.filter((id) => id !== nodeId));
  }, [store]);

  // 取消选择边
  const deselectEdge = useCallback((edgeId: string) => {
    store.setSelectedEdges(store.selectedEdges.filter((id) => id !== edgeId));
  }, [store]);

  // 检查节点是否被选中
  const isNodeSelected = useCallback((nodeId: string): boolean => {
    return store.selectedNodes.includes(nodeId);
  }, [store.selectedNodes]);

  // 检查边是否被选中
  const isEdgeSelected = useCallback((edgeId: string): boolean => {
    return store.selectedEdges.includes(edgeId);
  }, [store.selectedEdges]);

  // 获取选中的边
  const getSelectedEdges = useCallback((): WorkflowEdge[] => {
    return store.edges.filter((edge) => store.selectedEdges.includes(edge.id));
  }, [store.edges, store.selectedEdges]);

  // 删除选中的元素
  const removeSelected = useCallback(() => {
    if (store.selectedNodes.length > 0) {
      store.removeNodes(store.selectedNodes);
    }
    if (store.selectedEdges.length > 0) {
      store.removeEdges(store.selectedEdges);
    }
  }, [store]);

  // 复制节点
  const duplicateNodes = useCallback((nodeIds: string[]): WorkflowNode[] => {
    const nodesToDuplicate = store.nodes.filter((n) => nodeIds.includes(n.id));
    const newNodes: WorkflowNode[] = [];

    nodesToDuplicate.forEach((node) => {
      const newNode: WorkflowNode = {
        ...node,
        id: generateId(),
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50,
        },
        selected: false,
      };
      store.addNode(newNode);
      newNodes.push(newNode);
    });

    return newNodes;
  }, [store]);

  // 序列化
  const toObject = useCallback(() => {
    return {
      nodes: store.nodes,
      edges: store.edges,
    };
  }, [store.nodes, store.edges]);

  // 反序列化
  const fromObject = useCallback((data: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }) => {
    store.setNodes(data.nodes);
    store.setEdges(data.edges);
  }, [store]);

  // 重置
  const reset = useCallback(() => {
    store.resetCanvas();
  }, [store]);

  return useMemo(
    () => ({
      // 状态
      nodes: store.nodes,
      edges: store.edges,
      selectedNodes: store.selectedNodes,
      selectedEdges: store.selectedEdges,
      reactFlowInstance: store.reactFlowInstance,
      
      // 计算属性
      hasSelection,
      selectedNodeCount,
      selectedEdgeCount,
      nodeCount,
      edgeCount,
      
      // 节点操作
      addNode,
      updateNode: store.updateNode,
      updateNodeConfig,
      removeNode: store.removeNode,
      removeNodes: store.removeNodes,
      getNode: store.getNode,
      getNodeByType,
      
      // 边操作
      addEdge,
      removeEdge: store.removeEdge,
      removeEdges: store.removeEdges,
      getEdge: store.getEdge,
      getEdgesBySource,
      getEdgesByTarget,
      
      // 选中操作
      selectNode,
      selectNodes,
      selectEdge,
      deselectNode,
      deselectEdge,
      clearSelection: store.clearSelection,
      isNodeSelected,
      isEdgeSelected,
      getSelectedNodes: store.getSelectedNodes,
      getSelectedEdges,
      
      // 批量操作
      removeSelected,
      duplicateNodes,
      
      // 画布操作
      setReactFlowInstance: store.setReactFlowInstance,
      onNodesChange: store.onNodesChange,
      onEdgesChange: store.onEdgesChange,
      onConnect: store.onConnect,
      
      // 序列化
      toObject,
      fromObject,
      reset,
    }),
    [
      store,
      hasSelection,
      selectedNodeCount,
      selectedEdgeCount,
      nodeCount,
      edgeCount,
      addNode,
      updateNodeConfig,
      getNodeByType,
      addEdge,
      getEdgesBySource,
      getEdgesByTarget,
      selectNode,
      selectNodes,
      selectEdge,
      deselectNode,
      deselectEdge,
      isNodeSelected,
      isEdgeSelected,
      getSelectedEdges,
      removeSelected,
      duplicateNodes,
      toObject,
      fromObject,
      reset,
    ]
  );
};

export default useFlowState;
