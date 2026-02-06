import { NodeExecutor } from './NodeExecutor';
import { DAGNode, ExecutionContext } from '../types';

/**
 * EndNodeExecutor - 执行 End 节点
 * 作为工作流的出口，收集并返回最终结果
 */
export class EndNodeExecutor extends NodeExecutor {
  async execute(
    node: DAGNode,
    context: ExecutionContext,
    _engine: unknown
  ): Promise<unknown> {
    console.log('[EndNodeExecutor] ▶️ execute()', node.id);
    
    // 收集上游节点的输出
    const inputs: Record<string, unknown> = {};
    for (const inputNodeId of node.inputs) {
      const output = context.nodeOutputs.get(inputNodeId);
      if (output !== undefined) {
        inputs[inputNodeId] = output;
      }
    }
    
    console.log('[EndNodeExecutor] 📥 上游输入:', Object.keys(inputs));
    
    // End 节点返回最终结果
    const result = {
      status: 'completed',
      timestamp: new Date().toISOString(),
      message: '工作流执行完成',
      inputs,
    };
    
    console.log('[EndNodeExecutor] ✅ 执行完成', result);
    return result;
  }
}
