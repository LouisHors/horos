import { WorkflowNode, WorkflowEdge, ExecutionStatus } from '@horos/editor';
import { WorkflowParser } from './WorkflowParser';
import { ExecutionScheduler } from './ExecutionScheduler';
import { NodeExecutor } from '../executors/NodeExecutor';
import { ExecutionState, ExecutionContext, WorkflowDAG } from '../types';

export interface ExecutionEngineConfig {
  enableCheckpoint?: boolean;
  checkpointInterval?: number;
  parallel?: boolean;
  maxConcurrency?: number;
}

export class ExecutionEngine {
  private parser: WorkflowParser;
  private scheduler: ExecutionScheduler;
  private executor: NodeExecutor;
  private config: ExecutionEngineConfig;
  private executions = new Map<string, ExecutionState>();
  
  constructor(config: ExecutionEngineConfig = {}) {
    this.parser = new WorkflowParser();
    this.scheduler = new ExecutionScheduler();
    this.executor = new NodeExecutor();
    this.config = {
      enableCheckpoint: true,
      checkpointInterval: 5000,
      parallel: false,
      maxConcurrency: 5,
      ...config,
    };
  }
  
  /**
   * 启动执行
   */
  async start(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    initialContext: Record<string, unknown> = {}
  ): Promise<ExecutionState> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 解析 DAG
    const dag = this.parser.parse(nodes, edges);
    
    // 创建执行状态
    const state: ExecutionState = {
      executionId,
      status: ExecutionStatus.RUNNING,
      currentNodes: dag.startNodes,
      completedNodes: [],
      failedNodes: [],
      pendingNodes: Array.from(dag.nodes.keys()).filter(
        id => !dag.startNodes.includes(id)
      ),
      context: {
        executionId,
        workflowId: dag.id,
        variables: new Map(Object.entries(initialContext)),
        nodeOutputs: new Map(),
        startTime: new Date(),
      },
    };
    
    this.executions.set(executionId, state);
    
    // 开始执行
    this.runExecution(executionId, dag);
    
    return state;
  }
  
  /**
   * 执行工作流
   */
  private async runExecution(executionId: string, dag: WorkflowDAG): Promise<void> {
    const state = this.executions.get(executionId)!;
    const completed = new Set<string>();
    
    while (completed.size < dag.nodes.size) {
      // 获取准备执行的节点
      const ready = this.scheduler.getReadyNodes(dag, completed);
      
      if (ready.length === 0) {
        // 检查是否有失败的节点
        if (state.failedNodes.length > 0) {
          state.status = ExecutionStatus.FAILED;
          break;
        }
        break;
      }
      
      // 执行准备就绪的节点
      if (this.config.parallel) {
        // 并行执行
        const batch = ready.slice(0, this.config.maxConcurrency);
        await Promise.all(
          batch.map(id => this.executeNode(id, dag, state, completed))
        );
      } else {
        // 串行执行
        for (const nodeId of ready) {
          await this.executeNode(nodeId, dag, state, completed);
        }
      }
      
      // 更新当前节点
      state.currentNodes = this.scheduler.getReadyNodes(dag, completed);
    }
    
    // 更新最终状态
    if (state.failedNodes.length > 0) {
      state.status = ExecutionStatus.FAILED;
    } else if (completed.size === dag.nodes.size) {
      state.status = ExecutionStatus.COMPLETED;
    }
  }
  
  /**
   * 执行单个节点
   */
  private async executeNode(
    nodeId: string,
    dag: WorkflowDAG,
    state: ExecutionState,
    completed: Set<string>
  ): Promise<void> {
    const dagNode = dag.nodes.get(nodeId)!;
    const result = await this.executor.execute(dagNode.node, state.context);
    
    if (result.status === 'success') {
      completed.add(nodeId);
      state.completedNodes.push(nodeId);
      state.context.nodeOutputs.set(nodeId, result.output);
    } else {
      state.failedNodes.push(nodeId);
    }
  }
  
  /**
   * 获取执行状态
   */
  getState(executionId: string): ExecutionState | undefined {
    return this.executions.get(executionId);
  }
  
  /**
   * 停止执行
   */
  stop(executionId: string): boolean {
    const state = this.executions.get(executionId);
    if (state) {
      state.status = ExecutionStatus.CANCELLED;
      return true;
    }
    return false;
  }
}
