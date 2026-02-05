import { useCallback, useRef, useState } from 'react';
import { HistoryManager, HistoryEntry } from '../core/HistoryManager';
import { WorkflowNode, WorkflowEdge } from '../types';

export interface UseHistoryOptions {
  maxHistory?: number;
  onStateChange?: (state: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }) => void;
}

export interface UseHistoryReturn {
  // 状态
  canUndo: boolean;
  canRedo: boolean;
  historyLength: number;
  currentIndex: number;
  history: HistoryEntry[];
  
  // 操作
  record: (
    type: HistoryEntry['type'],
    description: string,
    previousState: { nodes: WorkflowNode[]; edges: WorkflowEdge[] },
    nextState: { nodes: WorkflowNode[]; edges: WorkflowEdge[] },
    affectedIds?: string[]
  ) => void;
  undo: () => { nodes: WorkflowNode[]; edges: WorkflowEdge[] } | null;
  redo: () => { nodes: WorkflowNode[]; edges: WorkflowEdge[] } | null;
  jumpTo: (index: number) => { nodes: WorkflowNode[]; edges: WorkflowEdge[] } | null;
  clear: () => void;
  
  // 便捷方法
  recordAddNode: (node: WorkflowNode, currentNodes: WorkflowNode[], currentEdges: WorkflowEdge[]) => void;
  recordRemoveNode: (
    removedNode: WorkflowNode,
    removedEdges: WorkflowEdge[],
    currentNodes: WorkflowNode[],
    currentEdges: WorkflowEdge[]
  ) => void;
  recordUpdateNode: (
    nodeId: string,
    oldData: Partial<WorkflowNode['data']>,
    newData: Partial<WorkflowNode['data']>,
    currentNodes: WorkflowNode[],
    currentEdges: WorkflowEdge[]
  ) => void;
  recordAddEdge: (edge: WorkflowEdge, currentNodes: WorkflowNode[], currentEdges: WorkflowEdge[]) => void;
  recordRemoveEdge: (removedEdge: WorkflowEdge, currentNodes: WorkflowNode[], currentEdges: WorkflowEdge[]) => void;
}

/**
 * 历史管理 Hook - 提供撤销/重做功能
 */
export function useHistory(options: UseHistoryOptions = {}): UseHistoryReturn {
  const managerRef = useRef(new HistoryManager({ maxHistory: options.maxHistory }));
  const [, setVersion] = useState(0); // 用于触发重渲染
  
  const forceUpdate = useCallback(() => {
    setVersion(v => v + 1);
  }, []);
  
  /**
   * 记录操作
   */
  const record = useCallback((
    type: HistoryEntry['type'],
    description: string,
    previousState: { nodes: WorkflowNode[]; edges: WorkflowEdge[] },
    nextState: { nodes: WorkflowNode[]; edges: WorkflowEdge[] },
    affectedIds: string[] = []
  ) => {
    managerRef.current.record({
      type,
      description,
      previousState,
      nextState,
      affectedIds,
    });
    forceUpdate();
  }, [forceUpdate]);
  
  /**
   * 撤销
   */
  const undo = useCallback(() => {
    const result = managerRef.current.undo();
    if (result) {
      options.onStateChange?.(result);
      forceUpdate();
    }
    return result;
  }, [forceUpdate, options]);
  
  /**
   * 重做
   */
  const redo = useCallback(() => {
    const result = managerRef.current.redo();
    if (result) {
      options.onStateChange?.(result);
      forceUpdate();
    }
    return result;
  }, [forceUpdate, options]);
  
  /**
   * 跳转到指定位置
   */
  const jumpTo = useCallback((index: number) => {
    const result = managerRef.current.jumpTo(index);
    if (result) {
      options.onStateChange?.(result);
      forceUpdate();
    }
    return result;
  }, [forceUpdate, options]);
  
  /**
   * 清除历史
   */
  const clear = useCallback(() => {
    managerRef.current.clear();
    forceUpdate();
  }, [forceUpdate]);
  
  // ===== 便捷方法 =====
  
  const recordAddNode = useCallback((
    node: WorkflowNode,
    currentNodes: WorkflowNode[],
    currentEdges: WorkflowEdge[]
  ) => {
    managerRef.current.recordAddNode(node, currentNodes, currentEdges);
    forceUpdate();
  }, [forceUpdate]);
  
  const recordRemoveNode = useCallback((
    removedNode: WorkflowNode,
    removedEdges: WorkflowEdge[],
    currentNodes: WorkflowNode[],
    currentEdges: WorkflowEdge[]
  ) => {
    managerRef.current.recordRemoveNode(removedNode, removedEdges, currentNodes, currentEdges);
    forceUpdate();
  }, [forceUpdate]);
  
  const recordUpdateNode = useCallback((
    nodeId: string,
    oldData: Partial<WorkflowNode['data']>,
    newData: Partial<WorkflowNode['data']>,
    currentNodes: WorkflowNode[],
    currentEdges: WorkflowEdge[]
  ) => {
    managerRef.current.recordUpdateNode(nodeId, oldData, newData, currentNodes, currentEdges);
    forceUpdate();
  }, [forceUpdate]);
  
  const recordAddEdge = useCallback((
    edge: WorkflowEdge,
    currentNodes: WorkflowNode[],
    currentEdges: WorkflowEdge[]
  ) => {
    managerRef.current.recordAddEdge(edge, currentNodes, currentEdges);
    forceUpdate();
  }, [forceUpdate]);
  
  const recordRemoveEdge = useCallback((
    removedEdge: WorkflowEdge,
    currentNodes: WorkflowNode[],
    currentEdges: WorkflowEdge[]
  ) => {
    managerRef.current.recordRemoveEdge(removedEdge, currentNodes, currentEdges);
    forceUpdate();
  }, [forceUpdate]);
  
  const manager = managerRef.current;
  
  return {
    canUndo: manager.canUndo(),
    canRedo: manager.canRedo(),
    historyLength: manager.getHistoryLength(),
    currentIndex: manager.getCurrentIndex(),
    history: manager.getHistory(),
    record,
    undo,
    redo,
    jumpTo,
    clear,
    recordAddNode,
    recordRemoveNode,
    recordUpdateNode,
    recordAddEdge,
    recordRemoveEdge,
  };
}

export default useHistory;
