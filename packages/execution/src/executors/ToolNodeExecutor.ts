import { NodeExecutor } from './NodeExecutor';
import { DAGNode, ExecutionContext } from '../types';

export type ToolType = 'http' | 'code' | 'delay' | 'log';

export interface ToolConfig {
  toolType: ToolType;
  config: Record<string, unknown>;
}

export interface HTTPConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
}

export interface CodeConfig {
  language: 'javascript' | 'python';
  code: string;
}

export interface DelayConfig {
  duration: number; // milliseconds
}

/**
 * ToolNodeExecutor - 执行工具节点
 */
export class ToolNodeExecutor extends NodeExecutor {
  async execute(
    node: DAGNode,
    context: ExecutionContext,
    _engine: unknown
  ): Promise<unknown> {
    const data = node.data;
    const toolType = (data.toolType as ToolType) || 'log';
    const config = (data.config as Record<string, unknown>) || {};
    
    switch (toolType) {
      case 'http':
        return this.executeHTTP(config as unknown as HTTPConfig);
      case 'code':
        return this.executeCode(config as unknown as CodeConfig);
      case 'delay':
        return this.executeDelay(config as unknown as DelayConfig);
      case 'log':
        return this.executeLog(node, context);
      default:
        throw new Error(`Unknown tool type: ${toolType}`);
    }
  }
  
  /**
   * 执行 HTTP 请求
   */
  private async executeHTTP(config: HTTPConfig): Promise<unknown> {
    const { url, method = 'GET', headers = {}, body } = config;
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      
      const responseData = await response.json().catch(() => ({}));
      
      return {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'HTTP request failed',
      };
    }
  }
  
  /**
   * 执行代码（简化版，仅支持简单 JS）
   */
  private async executeCode(config: CodeConfig): Promise<unknown> {
    const { language, code } = config;
    
    if (language === 'javascript') {
      try {
        // 创建一个安全的执行环境
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
        };
        
        const func = new Function(...Object.keys(sandbox), `return (async () => { ${code} })()`);
        const result = await func(...Object.values(sandbox));
        
        return {
          success: true,
          result,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Code execution failed',
        };
      }
    }
    
    return {
      success: false,
      error: `Language ${language} not supported yet`,
    };
  }
  
  /**
   * 延迟执行
   */
  private async executeDelay(config: DelayConfig): Promise<unknown> {
    const { duration } = config;
    
    await new Promise(resolve => setTimeout(resolve, duration));
    
    return {
      success: true,
      duration,
    };
  }
  
  /**
   * 日志输出
   */
  private async executeLog(node: DAGNode, context: ExecutionContext): Promise<unknown> {
    const inputs = node.inputs.map(id => ({
      nodeId: id,
      output: context.nodeOutputs.get(id),
    }));
    
    console.log(`[ToolNode ${node.id}] Log:`, JSON.stringify(inputs, null, 2));
    
    return {
      logged: inputs,
    };
  }
}
