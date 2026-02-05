import { DAG, ExecutionContext, DAGNode } from '../types';
import { ExecutionEngine } from './ExecutionEngine';

export interface SchedulerConfig {
  maxParallelism: number;
  enableParallel?: boolean;
}

/**
 * 执行调度器
 */
export class ExecutionScheduler {
  private config: SchedulerConfig;
  private executionSlots: Map<string, boolean> = new Map();
  private completedNodes: Set<string> = new Set();
  private dag?: DAG;

  constructor(config: SchedulerConfig) {
    this.config = {
      enableParallel: true,
      ...config,
    };
  }

  /**
   * 初始化调度器
   */
  initialize(dag: DAG): void {
    this.dag = dag;
    this.completedNodes.clear();
  }

  /**
   * 获取就绪节点
   */
  getReadyNodes(): string[] {
    if (!this.dag) return [];
    
    return this.dag.nodes
      .filter(node => {
        // 节点未执行
        if (this.completedNodes.has(node.id)) return false;
        // 所有依赖已完成
        return node.inputs.every(input => this.completedNodes.has(input));
      })
      .map(node => node.id);
  }

  /**
   * 标记节点完成
   */
  completeNode(nodeId: string): void {
    this.completedNodes.add(nodeId);
  }

  /**
   * 调度执行
   */
  async scheduleExecution(
    dag: DAG,
    engine: ExecutionEngine,
    context: ExecutionContext
  ): Promise<void> {
    this.initialize(dag);
    
    for (const level of dag.executionOrder) {
      if (this.config.enableParallel && level.length > 1) {
        await this.executeParallel(level, dag, engine, context);
      } else {
        await this.executeSequential(level, dag, engine, context);
      }
      
      // 更新已完成节点
      level.forEach(id => this.completeNode(id));
    }
  }

  /**
   * 并行执行节点
   */
  private async executeParallel(
    nodeIds: string[],
    dag: DAG,
    engine: ExecutionEngine,
    context: ExecutionContext
  ): Promise<void> {
    const executing = nodeIds.map(id => engine.executeNode(id, dag, context));
    await Promise.all(executing);
  }

  /**
   * 串行执行节点
   */
  private async executeSequential(
    nodeIds: string[],
    dag: DAG,
    engine: ExecutionEngine,
    context: ExecutionContext
  ): Promise<void> {
    for (const nodeId of nodeIds) {
      await engine.executeNode(nodeId, dag, context);
    }
  }
}
