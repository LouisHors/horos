// 从执行引擎导入
// 注意：实际项目中通过 workspace 依赖引用
import {
  ExecutionEngine,
  WorkflowNode,
  WorkflowEdge,
  ExecutionResult,
  NodeType,
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - 构建时从 workspace 解析
} from '@horos/execution';
import type { Node, Edge } from '@xyflow/react';
import { NodeData } from '../types';

export type ExecutionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed';

export interface NodeExecutionState {
  nodeId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  output?: unknown;
  error?: Error;
  startTime?: Date;
  endTime?: Date;
}

export interface ExecutionBridgeCallbacks {
  onNodeStart?: (nodeId: string) => void;
  onNodeComplete?: (nodeId: string, output: unknown) => void;
  onNodeError?: (nodeId: string, error: Error) => void;
  onExecutionComplete?: (result: ExecutionResult) => void;
  onExecutionError?: (error: Error) => void;
  onStatusChange?: (status: ExecutionStatus) => void;
}

/**
 * ExecutionBridge - 连接编辑器与执行引擎的桥梁
 */
export class ExecutionBridge {
  private engine: ExecutionEngine;
  private callbacks: ExecutionBridgeCallbacks;
  private nodeStates = new Map<string, NodeExecutionState>();
  private _status: ExecutionStatus = 'idle';

  constructor(callbacks: ExecutionBridgeCallbacks = {}) {
    console.log('[ExecutionBridge] 🔨 创建实例');
    this.callbacks = callbacks;
    this.engine = new ExecutionEngine();
    this.setupEventListeners();
    console.log('[ExecutionBridge] ✅ 初始化完成');
  }

  /**
   * 获取当前执行状态
   */
  get status(): ExecutionStatus {
    return this._status;
  }

  /**
   * 获取节点执行状态
   */
  getNodeState(nodeId: string): NodeExecutionState | undefined {
    return this.nodeStates.get(nodeId);
  }

  /**
   * 获取所有节点状态
   */
  getAllNodeStates(): Map<string, NodeExecutionState> {
    return new Map(this.nodeStates);
  }

  /**
   * 启动执行
   */
  async start(nodes: Node<NodeData>[], edges: Edge[]): Promise<ExecutionResult> {
    console.log('[ExecutionBridge] 🚀 start()', { nodeCount: nodes.length, edgeCount: edges.length });
    this.resetState();
    this.setStatus('running');

    // 转换 ReactFlow 节点/边为执行引擎格式
    console.log('[ExecutionBridge] 📝 转换节点和边...');
    const workflowNodes = this.convertNodes(nodes);
    const workflowEdges = this.convertEdges(edges);
    console.log('[ExecutionBridge] 📊 转换完成', { workflowNodeCount: workflowNodes.length, workflowEdgeCount: workflowEdges.length });

    try {
      console.log('[ExecutionBridge] ⚙️ 调用引擎执行...');
      const result = await this.engine.execute(workflowNodes, workflowEdges);
      console.log('[ExecutionBridge] ✅ 引擎执行完成', { success: result.success, duration: result.duration });
      
      if (result.success) {
        this.setStatus('completed');
      } else {
        this.setStatus('failed');
      }

      this.callbacks.onExecutionComplete?.(result);
      return result;
    } catch (error) {
      console.error('[ExecutionBridge] ❌ 执行失败:', error);
      this.setStatus('failed');
      this.callbacks.onExecutionError?.(error as Error);
      throw error;
    }
  }

  /**
   * 暂停执行
   */
  pause(): void {
    this.engine.pause();
    this.setStatus('paused');
  }

  /**
   * 恢复执行
   */
  resume(): void {
    this.engine.resume();
    this.setStatus('running');
  }

  /**
   * 停止执行
   */
  stop(): void {
    this.engine.cancel();
    this.setStatus('idle');
  }

  /**
   * 重置状态
   */
  reset(): void {
    this.resetState();
    this.setStatus('idle');
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    this.engine.on('progress', (data: any) => {
      const { nodeId, status, result } = data;
      
      switch (status) {
        case 'running':
          this.updateNodeState(nodeId, { status: 'running', startTime: new Date() });
          this.callbacks.onNodeStart?.(nodeId);
          break;
        case 'completed':
          this.updateNodeState(nodeId, { 
            status: 'completed', 
            output: result,
            endTime: new Date()
          });
          this.callbacks.onNodeComplete?.(nodeId, result);
          break;
        case 'failed':
          this.updateNodeState(nodeId, { 
            status: 'failed', 
            error: new Error('Execution failed'),
            endTime: new Date()
          });
          this.callbacks.onNodeError?.(nodeId, new Error('Execution failed'));
          break;
      }
    });
  }

  /**
   * 更新节点状态
   */
  private updateNodeState(nodeId: string, updates: Partial<NodeExecutionState>): void {
    const current = this.nodeStates.get(nodeId);
    this.nodeStates.set(nodeId, {
      nodeId,
      status: 'pending',
      ...current,
      ...updates,
    });
  }

  /**
   * 重置所有状态
   */
  private resetState(): void {
    this.nodeStates.clear();
  }

  /**
   * 设置执行状态
   */
  private setStatus(status: ExecutionStatus): void {
    console.log('[ExecutionBridge] 📊 状态变更:', status);
    this._status = status;
    this.callbacks.onStatusChange?.(status);
  }

  /**
   * 转换 ReactFlow 节点为工作流节点
   */
  private convertNodes(nodes: Node<NodeData>[]): WorkflowNode[] {
    console.log('[ExecutionBridge] 📝 转换', nodes.length, '个节点');
    return nodes.map(node => {
      const mapped = {
        id: node.id,
        type: this.mapNodeType(node.type || 'default'),
        data: node.data || {},
        position: node.position,
      };
      console.log('[ExecutionBridge]   →', node.id, '=>', mapped.type);
      return mapped;
    });
  }

  /**
   * 转换 ReactFlow 边为工作流边
   */
  private convertEdges(edges: Edge[]): WorkflowEdge[] {
    return edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle || undefined,
      targetHandle: edge.targetHandle || undefined,
    }));
  }

  /**
   * 映射节点类型
   */
  private mapNodeType(nodeType: string): string {
    const typeMap: Record<string, string> = {
      'start': NodeType.START,
      'end': NodeType.END,
      'agent': NodeType.AGENT,
      'tool': NodeType.TOOL,
      'condition': NodeType.CONDITION,
      'loop': NodeType.LOOP,
      'delay': NodeType.DELAY,
      'webhook': NodeType.WEBHOOK,
      'code': NodeType.CODE,
    };

    return typeMap[nodeType] || nodeType;
  }
}
