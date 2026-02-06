import { NodeExecutor } from './NodeExecutor';
import { DAGNode, ExecutionContext } from '../types';

export interface CodeConfig {
  language: 'javascript' | 'python';
  code: string;
  timeout?: number;
}

/**
 * CodeNodeExecutor - 代码执行节点
 * 在沙箱环境中执行代码
 */
export class CodeNodeExecutor extends NodeExecutor {
  async execute(
    node: DAGNode,
    context: ExecutionContext,
    _engine: any
  ): Promise<unknown> {
    const config = node.data.config as CodeConfig;
    const language = config?.language || 'javascript';
    const code = config?.code || '';
    const timeout = config?.timeout || 5000;

    if (!code.trim()) {
      return { error: 'No code provided' };
    }

    // 获取输入数据
    const inputs = this.collectInputs(node, context);

    try {
      if (language === 'javascript') {
        return await this.executeJavaScript(code, inputs, timeout);
      } else {
        return { error: `Language ${language} not supported in browser environment` };
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Code execution failed',
      };
    }
  }

  private async executeJavaScript(
    code: string,
    inputs: Record<string, unknown>,
    timeout: number
  ): Promise<unknown> {
    // 创建安全的执行环境
    const sandbox = {
      console,
      Math,
      JSON,
      Date,
      Array,
      Object,
      String,
      Number,
      Boolean,
      Promise,
      Set,
      Map,
      RegExp,
      Error,
      inputs,
      // 限制性的 fetch
      fetch: (url: string, options?: RequestInit) => {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          throw new Error('Only HTTP/HTTPS URLs allowed');
        }
        return fetch(url, { ...options, mode: 'cors' });
      },
    };

    // 使用 Function 创建沙箱（比 eval 更安全）
    const func = new Function(
      ...Object.keys(sandbox),
      `
        return (async () => {
          ${code}
        })();
      `
    );

    // 设置超时
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Code execution timeout')), timeout);
    });

    const result = await Promise.race([
      func(...Object.values(sandbox)),
      timeoutPromise,
    ]);

    return {
      success: true,
      result,
    };
  }

  private collectInputs(node: DAGNode, context: ExecutionContext): Record<string, unknown> {
    const inputs: Record<string, unknown> = {};
    
    for (const inputNodeId of node.inputs) {
      const output = context.nodeOutputs.get(inputNodeId);
      if (output !== undefined) {
        inputs[inputNodeId] = output;
      }
    }
    
    return inputs;
  }
}
