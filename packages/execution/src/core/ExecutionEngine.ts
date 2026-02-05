import { 
  WorkflowNode, WorkflowEdge, DAG, NodeType, 
  ExecutionContext, ExecutionResult, ExecutionStatus,
  ExecutionState, NodeExecutionResult, ExecutionError
} from '../types';
import { WorkflowParser } from './WorkflowParser';
import { ExecutionScheduler } from './ExecutionScheduler';
import { NodeExecutor } from '../executors/NodeExecutor';

type EventHandler = (data: unknown) => void;

/**
 * 工作流执行引擎
 */
export class ExecutionEngine {
  private parser: WorkflowParser;
  private scheduler: ExecutionScheduler;
  private executors: Map<string, NodeExecutor> = new Map();
  private state: ExecutionState | null = null;
  private eventHandlers: Map<string, EventHandler[]> = new Map();

  constructor() {
    this.parser = new WorkflowParser();
    this.scheduler = new ExecutionScheduler({ maxParallelism: 5 });
  }

  /**
   * 注册节点执行器
   */
  registerExecutor(nodeType: string, executor: NodeExecutor): void {
    this.executors.set(nodeType, executor);
  }

  /**
   * 执行工作流
   */
  async execute(nodes: WorkflowNode[], edges: WorkflowEdge[]): Promise<ExecutionResult> {
    const executionId = `exec_${Date.now()}`;
    const startTime = Date.now();

    try {
      // 解析 DAG
      const dag = this.parser.parseWorkflow(nodes, edges);

      // 初始化执行上下文
      const context: ExecutionContext = {
        executionId,
        workflowId: 'workflow_1',
        variables: new Map(),
        nodeOutputs: new Map(),
        startTime: new Date(),
      };

      // 初始化状态
      this.state = {
        executionId,
        status: 'running',
        currentNodes: dag.executionOrder[0] || [],
        completedNodes: [],
        failedNodes: [],
        pendingNodes: dag.nodes.map(n => n.id),
        context,
      };

      this.emit('start', { executionId });

      // 调度执行
      await this.scheduler.scheduleExecution(dag, this, context);

      // 构建结果
      return {
        success: true,
        executionId,
        status: 'completed',
        outputs: context.nodeOutputs,
        errors: [],
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        executionId,
        status: 'failed',
        outputs: new Map(),
        errors: [{
          nodeId: '',
          error: error as Error,
          recoverable: false,
        }],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * 执行单个节点
   */
  async executeNode(nodeId: string, dag: DAG, context: ExecutionContext): Promise<unknown> {
    const node = dag.nodes.find(n => n.id === nodeId);
    if (!node) throw new Error(`Node not found: ${nodeId}`);

    this.emit('progress', { nodeId, status: 'running' });

    const executor = this.executors.get(node.type);
    if (!executor) {
      throw new Error(`No executor for node type: ${node.type}`);
    }

    const result = await executor.execute(node, context, this);
    context.nodeOutputs.set(nodeId, result);

    // 更新状态
    if (this.state) {
      this.state.completedNodes.push(nodeId);
      this.state.currentNodes = this.state.currentNodes.filter(id => id !== nodeId);
    }

    this.emit('progress', { nodeId, status: 'completed', result });

    return result;
  }

  /**
   * 获取当前状态
   */
  getState(): ExecutionState | null {
    return this.state;
  }

  /**
   * 暂停执行
   */
  pause(): void {
    if (this.state) {
      this.state.status = 'paused';
      this.emit('pause', { executionId: this.state.executionId });
    }
  }

  /**
   * 恢复执行
   */
  resume(): void {
    if (this.state) {
      this.state.status = 'running';
      this.emit('resume', { executionId: this.state.executionId });
    }
  }

  /**
   * 取消执行
   */
  cancel(): void {
    if (this.state) {
      this.state.status = 'cancelled';
      this.emit('cancel', { executionId: this.state.executionId });
    }
  }

  /**
   * 事件监听
   */
  on(event: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.push(handler);
    this.eventHandlers.set(event, handlers);
  }

  /**
   * 触发事件
   */
  private emit(event: string, data: unknown): void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => handler(data));
  }
}
