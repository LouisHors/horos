import { ExecutionState } from '../types';

export interface Checkpoint {
  id: string;
  executionId: string;
  timestamp: Date;
  status: string;
  currentNodes: string[];
  completedNodes: string[];
  failedNodes: string[];
  pendingNodes: string[];
  variables: Record<string, unknown>;
  nodeOutputs: Record<string, unknown>;
}

export class CheckpointManager {
  private checkpoints = new Map<string, Checkpoint>();
  
  /**
   * 创建检查点
   */
  async create(state: ExecutionState): Promise<Checkpoint> {
    const checkpoint: Checkpoint = {
      id: `chk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      executionId: state.executionId,
      timestamp: new Date(),
      status: state.status,
      currentNodes: [...state.currentNodes],
      completedNodes: [...state.completedNodes],
      failedNodes: [...state.failedNodes],
      pendingNodes: [...state.pendingNodes],
      variables: Object.fromEntries(state.context.variables),
      nodeOutputs: Object.fromEntries(state.context.nodeOutputs),
    };
    
    this.checkpoints.set(checkpoint.id, checkpoint);
    
    return checkpoint;
  }
  
  /**
   * 恢复执行状态
   */
  async restore(checkpointId: string): Promise<ExecutionState | null> {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) return null;
    
    return {
      executionId: checkpoint.executionId,
      status: checkpoint.status as any,
      currentNodes: checkpoint.currentNodes,
      completedNodes: checkpoint.completedNodes,
      failedNodes: checkpoint.failedNodes,
      pendingNodes: checkpoint.pendingNodes,
      context: {
        executionId: checkpoint.executionId,
        workflowId: '',
        variables: new Map(Object.entries(checkpoint.variables)),
        nodeOutputs: new Map(Object.entries(checkpoint.nodeOutputs)),
        startTime: checkpoint.timestamp,
      },
    };
  }
  
  /**
   * 获取执行的所有检查点
   */
  async getCheckpoints(executionId: string): Promise<Checkpoint[]> {
    return Array.from(this.checkpoints.values())
      .filter(chk => chk.executionId === executionId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  /**
   * 删除检查点
   */
  async delete(checkpointId: string): Promise<boolean> {
    return this.checkpoints.delete(checkpointId);
  }
}
