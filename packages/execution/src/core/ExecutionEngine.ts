import { 
  WorkflowNode, WorkflowEdge, DAG, NodeType, 
  ExecutionContext, ExecutionResult, ExecutionStatus,
  ExecutionState, NodeExecutionResult, ExecutionError
} from '../types';
import { WorkflowParser } from './WorkflowParser';
import { ExecutionScheduler } from './ExecutionScheduler';
import { NodeExecutor } from '../executors/NodeExecutor';
import { StartNodeExecutor } from '../executors/StartNodeExecutor';
import { EndNodeExecutor } from '../executors/EndNodeExecutor';
import { AgentNodeExecutor } from '../executors/AgentNodeExecutor';

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
    console.log('[ExecutionEngine] 🔨 创建实例');
    this.parser = new WorkflowParser();
    this.scheduler = new ExecutionScheduler({ maxParallelism: 5 });
    
    // 注册默认节点执行器
    console.log('[ExecutionEngine] 🔧 注册节点执行器...');
    this.registerExecutor('start', new StartNodeExecutor());
    this.registerExecutor('end', new EndNodeExecutor());
    this.registerExecutor('agent', new AgentNodeExecutor());
    console.log('[ExecutionEngine] ✅ 节点执行器注册完成');
    
    console.log('[ExecutionEngine] ✅ 初始化完成');
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
    console.log('[ExecutionEngine] 🚀 execute()', { executionId, nodeCount: nodes.length, edgeCount: edges.length });

    try {
      // 解析 DAG
      console.log('[ExecutionEngine] 📝 解析 DAG...');
      const dag = this.parser.parseWorkflow(nodes, edges);
      console.log('[ExecutionEngine] 📊 DAG 解析完成', { nodeCount: dag.nodes.length, executionOrder: dag.executionOrder });

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
      console.log('[ExecutionEngine] ⚙️ 开始调度执行...');
      await this.scheduler.scheduleExecution(dag, this, context);
      console.log('[ExecutionEngine] ✅ 调度执行完成');

      // 构建结果
      const result = {
        success: true,
        executionId,
        status: 'completed',
        outputs: context.nodeOutputs,
        errors: [],
        duration: Date.now() - startTime,
      };
      console.log('[ExecutionEngine] 🎉 执行成功', { duration: result.duration, outputCount: result.outputs.size });
      return result;
    } catch (error) {
      console.error('[ExecutionEngine] ❌ 执行失败:', error);
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
    console.log('[ExecutionEngine] ▶️ executeNode()', nodeId);
    const node = dag.nodes.find(n => n.id === nodeId);
    if (!node) {
      console.error('[ExecutionEngine] ❌ 节点未找到:', nodeId);
      throw new Error(`Node not found: ${nodeId}`);
    }
    console.log('[ExecutionEngine] 📋 节点信息', { type: node.type, data: node.data });

    this.emit('progress', { nodeId, status: 'running' });

    const executor = this.executors.get(node.type);
    if (!executor) {
      console.error('[ExecutionEngine] ❌ 无执行器:', node.type);
      throw new Error(`No executor for node type: ${node.type}`);
    }
    console.log('[ExecutionEngine] 🔧 找到执行器:', node.type);

    console.log('[ExecutionEngine] ⚙️ 执行节点...');
    const result = await executor.execute(node, context, this);
    console.log('[ExecutionEngine] ✅ 节点执行完成:', nodeId, { result });
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
