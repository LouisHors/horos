import { NodeExecutor } from './NodeExecutor';
import { DAGNode, ExecutionContext } from '../types';

/**
 * StartNodeExecutor - 执行 Start 节点
 * 作为工作流的入口，返回初始输入
 */
export class StartNodeExecutor extends NodeExecutor {
  async execute(
    node: DAGNode,
    context: ExecutionContext,
    _engine: unknown
  ): Promise<unknown> {
    console.log('[StartNodeExecutor] ▶️ execute()', node.id);
    
    // Start 节点作为入口，返回一个标准的开始信号
    const result = {
      status: 'started',
      timestamp: new Date().toISOString(),
      message: '工作流开始执行',
    };
    
    console.log('[StartNodeExecutor] ✅ 执行完成', result);
    return result;
  }
}
