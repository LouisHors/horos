import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  Connection,
  EdgeChange,
  NodeChange,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import { WorkflowNode, WorkflowEdge, CanvasState } from '../types';

// 画布状态接口
interface FlowState extends CanvasState {
  // 状态
  reactFlowInstance: any | null;
  
  // 动作
  setReactFlowInstance: (instance: any) => void;
  
  // 节点操作
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: WorkflowEdge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  
  // 选中操作
  setSelectedNodes: (nodeIds: string[]) => void;
  setSelectedEdges: (edgeIds: string[]) => void;
  clearSelection: () => void;
  
  // 增删改
  addNode: (node: WorkflowNode) => void;
  updateNode: (nodeId: string, data: Partial<WorkflowNode['data']>) => void;
  removeNode: (nodeId: string) => void;
  removeNodes: (nodeIds: string[]) => void;
  
  addEdge: (edge: WorkflowEdge) => void;
  removeEdge: (edgeId: string) => void;
  removeEdges: (edgeIds: string[]) => void;
  
  // 批量操作
  setCanvasState: (state: Partial<CanvasState>) => void;
  resetCanvas: () => void;
  
  // 查询
  getNode: (nodeId: string) => WorkflowNode | undefined;
  getEdge: (edgeId: string) => WorkflowEdge | undefined;
  getSelectedNodes: () => WorkflowNode[];
}

// 初始状态
const initialState: CanvasState = {
  nodes: [],
  edges: [],
  selectedNodes: [],
  selectedEdges: [],
};

// 创建 Store
export const useFlowStore = create<FlowState>()(
  immer((set, get) => ({
    ...initialState,
    reactFlowInstance: null,

    setReactFlowInstance: (instance) =>
      set((state) => {
        state.reactFlowInstance = instance;
      }),

    setNodes: (nodes) =>
      set((state) => {
        state.nodes = nodes;
      }),

    setEdges: (edges) =>
      set((state) => {
        state.edges = edges;
      }),

    onNodesChange: (changes) =>
      set((state) => {
        state.nodes = applyNodeChanges(changes, state.nodes) as WorkflowNode[];
        
        // 更新选中状态
        const selectionChange = changes.find(
          (c) => c.type === 'select'
        ) as any;
        if (selectionChange) {
          if (selectionChange.selected) {
            if (!state.selectedNodes.includes(selectionChange.id)) {
              state.selectedNodes.push(selectionChange.id);
            }
          } else {
            state.selectedNodes = state.selectedNodes.filter(
              (id) => id !== selectionChange.id
            );
          }
        }
      }),

    onEdgesChange: (changes) =>
      set((state) => {
        state.edges = applyEdgeChanges(changes, state.edges) as WorkflowEdge[];
      }),

    onConnect: (connection) =>
      set((state) => {
        const newEdge = {
          ...connection,
          id: `e-${connection.source}-${connection.sourceHandle}-${connection.target}-${connection.targetHandle}`,
          type: 'custom',
          animated: true,
        } as WorkflowEdge;
        state.edges = addEdge(newEdge, state.edges) as WorkflowEdge[];
      }),

    setSelectedNodes: (nodeIds) =>
      set((state) => {
        state.selectedNodes = nodeIds;
        // 同步更新节点选中状态
        state.nodes = state.nodes.map((node) => ({
          ...node,
          selected: nodeIds.includes(node.id),
        })) as WorkflowNode[];
      }),

    setSelectedEdges: (edgeIds) =>
      set((state) => {
        state.selectedEdges = edgeIds;
      }),

    clearSelection: () =>
      set((state) => {
        state.selectedNodes = [];
        state.selectedEdges = [];
        state.nodes = state.nodes.map((node) => ({
          ...node,
          selected: false,
        })) as WorkflowNode[];
      }),

    addNode: (node) =>
      set((state) => {
        state.nodes.push(node);
      }),

    updateNode: (nodeId, data) =>
      set((state) => {
        const node = state.nodes.find((n) => n.id === nodeId);
        if (node) {
          node.data = { ...node.data, ...data };
        }
      }),

    removeNode: (nodeId) =>
      set((state) => {
        state.nodes = state.nodes.filter((n) => n.id !== nodeId);
        // 同时删除相关边
        state.edges = state.edges.filter(
          (e) => e.source !== nodeId && e.target !== nodeId
        );
        // 从选中中移除
        state.selectedNodes = state.selectedNodes.filter((id) => id !== nodeId);
      }),

    removeNodes: (nodeIds) =>
      set((state) => {
        state.nodes = state.nodes.filter((n) => !nodeIds.includes(n.id));
        state.edges = state.edges.filter(
          (e) => !nodeIds.includes(e.source) && !nodeIds.includes(e.target)
        );
        state.selectedNodes = state.selectedNodes.filter(
          (id) => !nodeIds.includes(id)
        );
      }),

    addEdge: (edge) =>
      set((state) => {
        state.edges.push(edge);
      }),

    removeEdge: (edgeId) =>
      set((state) => {
        state.edges = state.edges.filter((e) => e.id !== edgeId);
        state.selectedEdges = state.selectedEdges.filter((id) => id !== edgeId);
      }),

    removeEdges: (edgeIds) =>
      set((state) => {
        state.edges = state.edges.filter((e) => !edgeIds.includes(e.id));
        state.selectedEdges = state.selectedEdges.filter(
          (id) => !edgeIds.includes(id)
        );
      }),

    setCanvasState: (canvasState) =>
      set((state) => {
        Object.assign(state, canvasState);
      }),

    resetCanvas: () =>
      set((state) => {
        Object.assign(state, initialState);
      }),

    getNode: (nodeId) => {
      return get().nodes.find((n) => n.id === nodeId);
    },

    getEdge: (edgeId) => {
      return get().edges.find((e) => e.id === edgeId);
    },

    getSelectedNodes: () => {
      const { nodes, selectedNodes } = get();
      return nodes.filter((n) => selectedNodes.includes(n.id));
    },
  }))
);

// 导出类型
export type { FlowState };
