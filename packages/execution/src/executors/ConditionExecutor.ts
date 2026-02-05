import { WorkflowNode } from '../types';
import { ExecutionContext } from '../types';

export interface ConditionBranch {
  label: string;
  condition: string;
  targetNodeId: string;
}

export class ConditionExecutor {
  /**
   * 评估条件
   */
  evaluate(condition: string, context: ExecutionContext): boolean {
    // 简单表达式评估
    try {
      const variables: Record<string, unknown> = {};
      context.variables.forEach((value, key) => {
        variables[key] = value;
      });
      
      // 简单的变量替换
      const evaluatedCondition = condition.replace(/\$\{(\w+)\}/g, (match, key) => {
        const value = variables[key];
        return typeof value === 'string' ? `"${value}"` : String(value);
      });
      
      // 注意：实际项目中应使用安全的表达式引擎
      return eval(evaluatedCondition);
    } catch (error) {
      console.error('Condition evaluation error:', error);
      return false;
    }
  }
  
  /**
   * 选择分支
   */
  selectBranch(
    node: WorkflowNode,
    context: ExecutionContext
  ): string | null {
    const branches = node.data.branches as ConditionBranch[] || [];
    
    for (const branch of branches) {
      if (this.evaluate(branch.condition, context)) {
        return branch.targetNodeId;
      }
    }
    
    return null;
  }
}
