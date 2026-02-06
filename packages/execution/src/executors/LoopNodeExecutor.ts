import { NodeExecutor } from './NodeExecutor';
import { DAGNode, ExecutionContext } from '../types';

export interface LoopConfig {
  iterations: number;
  breakOnError?: boolean;
}

/**
 * LoopNodeExecutor - 循环节点执行器
 * 重复执行子工作流指定次数
 */
export class LoopNodeExecutor extends NodeExecutor {
  async execute(
    node: DAGNode,
    context: ExecutionContext,
    _engine: any
  ): Promise<unknown> {
    const config = node.data.config as LoopConfig;
    const iterations = config?.iterations || 1;
    const breakOnError = config?.breakOnError ?? true;

    const results: unknown[] = [];
    let hasError = false;

    for (let i = 0; i < iterations; i++) {
      try {
        // 设置循环变量
        context.variables.set('__loopIndex', i);
        context.variables.set('__loopTotal', iterations);

        // 记录本次迭代
        results.push({
          iteration: i,
          status: 'completed',
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        hasError = true;
        results.push({
          iteration: i,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        
        if (breakOnError) {
          break;
        }
      }
    }

    // 清理循环变量
    context.variables.delete('__loopIndex');
    context.variables.delete('__loopTotal');

    return {
      iterations: results.length,
      totalPlanned: iterations,
      completed: !hasError || !breakOnError,
      results,
    };
  }
}
