import { WorkflowNode, WorkflowEdge } from '../types';

// 历史操作类型
export type HistoryActionType = 
  | 'ADD_NODE'
  | 'REMOVE_NODE'
  | 'UPDATE_NODE'
  | 'MOVE_NODE'
  | 'ADD_EDGE'
  | 'REMOVE_EDGE'
  | 'UPDATE_EDGE'
  | 'BATCH';

// 历史记录条目
export interface HistoryEntry {
  id: string;
  type: HistoryActionType;
  timestamp: number;
  description: string;
  
  // 之前的状态
  previousState: {
    nodes?: WorkflowNode[];
    edges?: WorkflowEdge[];
  };
  
  // 之后的状态
  nextState: {
    nodes?: WorkflowNode[];
    edges?: WorkflowEdge[];
  };
  
  // 关联的节点/边 ID
  affectedIds: string[];
}

// 历史管理器配置
export interface HistoryManagerConfig {
  maxHistory?: number;  // 最大历史记录数，默认 50
}

/**
 * 历史管理器 - 负责撤销/重做功能
 */
export class HistoryManager {
  private history: HistoryEntry[] = [];
  private currentIndex: number = -1;
  private maxHistory: number;
  
  constructor(config: HistoryManagerConfig = {}) {
    this.maxHistory = config.maxHistory ?? 50;
  }
  
  /**
   * 是否可以撤销
   */
  canUndo(): boolean {
    return this.currentIndex >= 0;
  }
  
  /**
   * 是否可以重做
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }
  
  /**
   * 获取当前历史长度
   */
  getHistoryLength(): number {
    return this.history.length;
  }
  
  /**
   * 获取当前索引
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }
  
  /**
   * 获取所有历史记录
   */
  getHistory(): HistoryEntry[] {
    return [...this.history];
  }
  
  /**
   * 记录一个操作
   */
  record(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): void {
    // 如果在中间状态，删除后面的历史
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }
    
    // 创建新条目
    const newEntry: HistoryEntry = {
      ...entry,
      id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    
    // 添加到历史
    this.history.push(newEntry);
    this.currentIndex++;
    
    // 限制历史长度
    if (this.history.length > this.maxHistory) {
      this.history.shift();
      this.currentIndex--;
    }
  }
  
  /**
   * 撤销操作
   * @returns 撤销后的状态，如果没有可撤销的则返回 null
   */
  undo(): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } | null {
    if (!this.canUndo()) {
      return null;
    }
    
    const entry = this.history[this.currentIndex];
    this.currentIndex--;
    
    return {
      nodes: entry.previousState.nodes ?? [],
      edges: entry.previousState.edges ?? [],
    };
  }
  
  /**
   * 重做操作
   * @returns 重做后的状态，如果没有可重做的则返回 null
   */
  redo(): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } | null {
    if (!this.canRedo()) {
      return null;
    }
    
    this.currentIndex++;
    const entry = this.history[this.currentIndex];
    
    return {
      nodes: entry.nextState.nodes ?? [],
      edges: entry.nextState.edges ?? [],
    };
  }
  
  /**
   * 跳转到指定历史位置
   */
  jumpTo(index: number): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } | null {
    if (index < -1 || index >= this.history.length) {
      return null;
    }
    
    this.currentIndex = index;
    
    if (index === -1) {
      return { nodes: [], edges: [] };
    }
    
    const entry = this.history[index];
    return {
      nodes: entry.nextState.nodes ?? [],
      edges: entry.nextState.edges ?? [],
    };
  }
  
  /**
   * 清除历史
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }
  
  /**
   * 记录节点添加
   */
  recordAddNode(node: WorkflowNode, currentNodes: WorkflowNode[], currentEdges: WorkflowEdge[]): void {
    this.record({
      type: 'ADD_NODE',
      description: `Add node ${node.data.label || node.type}`,
      previousState: { nodes: currentNodes, edges: currentEdges },
      nextState: {
        nodes: [...currentNodes, node],
        edges: currentEdges,
      },
      affectedIds: [node.id],
    });
  }
  
  /**
   * 记录节点删除
   */
  recordRemoveNode(
    removedNode: WorkflowNode,
    removedEdges: WorkflowEdge[],
    currentNodes: WorkflowNode[],
    currentEdges: WorkflowEdge[]
  ): void {
    const remainingNodes = currentNodes.filter(n => n.id !== removedNode.id);
    const remainingEdges = currentEdges.filter(e => 
      !removedEdges.some(re => re.id === e.id)
    );
    
    this.record({
      type: 'REMOVE_NODE',
      description: `Remove node ${removedNode.data.label || removedNode.type}`,
      previousState: { nodes: currentNodes, edges: currentEdges },
      nextState: { nodes: remainingNodes, edges: remainingEdges },
      affectedIds: [removedNode.id, ...removedEdges.map(e => e.id)],
    });
  }
  
  /**
   * 记录节点更新
   */
  recordUpdateNode(
    nodeId: string,
    _oldData: Partial<WorkflowNode['data']>,
    newData: Partial<WorkflowNode['data']>,
    currentNodes: WorkflowNode[],
    currentEdges: WorkflowEdge[]
  ): void {
    const updatedNodes = currentNodes.map(n => 
      n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n
    );
    
    this.record({
      type: 'UPDATE_NODE',
      description: `Update node ${nodeId}`,
      previousState: { nodes: currentNodes, edges: currentEdges },
      nextState: { nodes: updatedNodes, edges: currentEdges },
      affectedIds: [nodeId],
    });
  }
  
  /**
   * 记录边添加
   */
  recordAddEdge(edge: WorkflowEdge, currentNodes: WorkflowNode[], currentEdges: WorkflowEdge[]): void {
    this.record({
      type: 'ADD_EDGE',
      description: `Add edge`,
      previousState: { nodes: currentNodes, edges: currentEdges },
      nextState: {
        nodes: currentNodes,
        edges: [...currentEdges, edge],
      },
      affectedIds: [edge.id],
    });
  }
  
  /**
   * 记录边删除
   */
  recordRemoveEdge(
    removedEdge: WorkflowEdge,
    currentNodes: WorkflowNode[],
    currentEdges: WorkflowEdge[]
  ): void {
    this.record({
      type: 'REMOVE_EDGE',
      description: `Remove edge`,
      previousState: { nodes: currentNodes, edges: currentEdges },
      nextState: {
        nodes: currentNodes,
        edges: currentEdges.filter(e => e.id !== removedEdge.id),
      },
      affectedIds: [removedEdge.id],
    });
  }
  
  /**
   * 记录批量操作
   */
  recordBatch(
    description: string,
    previousNodes: WorkflowNode[],
    previousEdges: WorkflowEdge[],
    nextNodes: WorkflowNode[],
    nextEdges: WorkflowEdge[],
    affectedIds: string[]
  ): void {
    this.record({
      type: 'BATCH',
      description,
      previousState: { nodes: previousNodes, edges: previousEdges },
      nextState: { nodes: nextNodes, edges: nextEdges },
      affectedIds,
    });
  }
}

export default HistoryManager;
