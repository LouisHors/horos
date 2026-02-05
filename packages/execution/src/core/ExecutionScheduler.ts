import { WorkflowDAG } from '../types';

export interface ScheduleOptions {
  parallel?: boolean;
  maxConcurrency?: number;
}

export class ExecutionScheduler {
  /**
   * 获取准备执行的节点
   */
  getReadyNodes(dag: WorkflowDAG, completedNodes: Set<string>): string[] {
    const ready: string[] = [];
    
    dag.nodes.forEach((node, id) => {
      if (completedNodes.has(id)) return;
      
      // 检查所有依赖是否已完成
      const allDependenciesMet = node.dependencies.every(depId => 
        completedNodes.has(depId)
      );
      
      if (allDependenciesMet) {
        ready.push(id);
      }
    });
    
    return ready;
  }
  
  /**
   * 获取执行顺序（拓扑排序）
   */
  getExecutionOrder(dag: WorkflowDAG): string[][] {
    return dag.levels;
  }
  
  /**
   * 检查是否可以并行执行
   */
  canExecuteInParallel(nodeId1: string, nodeId2: string, dag: WorkflowDAG): boolean {
    const node1 = dag.nodes.get(nodeId1)!;
    const node2 = dag.nodes.get(nodeId2)!;
    
    // 同一层级且没有依赖关系的节点可以并行
    return node1.level === node2.level && 
           !node1.dependencies.includes(nodeId2) &&
           !node2.dependencies.includes(nodeId1);
  }
}
