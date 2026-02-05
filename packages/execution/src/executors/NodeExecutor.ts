import { DAGNode, ExecutionContext, NodeExecutor as INodeExecutor } from '../types';

/**
 * 节点执行器抽象基类
 */
export abstract class NodeExecutor implements INodeExecutor {
  /**
   * 执行节点
   */
  abstract execute(
    node: DAGNode,
    context: ExecutionContext,
    engine: any
  ): Promise<unknown>;

  /**
   * 获取输入数据
   */
  protected getInputData(nodeId: string, context: ExecutionContext): unknown {
    return context.nodeOutputs.get(nodeId);
  }

  /**
   * 设置输出数据
   */
  protected setOutputData(
    nodeId: string,
    data: unknown,
    context: ExecutionContext
  ): void {
    context.nodeOutputs.set(nodeId, data);
  }
}
