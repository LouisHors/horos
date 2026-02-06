import { NodeExecutor } from './NodeExecutor';
import { DAGNode, ExecutionContext } from '../types';
import { llmService, LLMMessage } from '../services/LLMService';

export interface AgentNodeConfig {
  model?: string;
  temperature?: number;
  systemPrompt?: string;
  maxTokens?: number;
}

/**
 * AgentNodeExecutor - 执行 AI Agent 节点
 * 调用 OpenAI API 进行对话
 */
export class AgentNodeExecutor extends NodeExecutor {
  async execute(
    node: DAGNode,
    context: ExecutionContext,
    _engine: unknown
  ): Promise<unknown> {
    const config = node.data as AgentNodeConfig;
    
    // 获取上游节点的输出作为输入
    const inputs = this.collectInputs(node, context);
    
    // 构建消息列表
    const messages: LLMMessage[] = [];
    
    // 添加系统提示词
    if (config.systemPrompt) {
      messages.push({ role: 'system', content: config.systemPrompt });
    }
    
    // 添加上下文历史（如果有）
    const contextHistory = context.variables.get('__messages') as LLMMessage[] | undefined;
    if (contextHistory && Array.isArray(contextHistory)) {
      messages.push(...contextHistory);
    }
    
    // 添加当前输入
    const userMessage = this.buildUserMessage(inputs);
    messages.push({ role: 'user', content: userMessage });
    
    // 调用 LLM
    const response = await llmService.chat(messages, {
      model: config.model || 'gpt-4o-mini',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens || 2000,
    });
    
    // 保存消息历史到上下文
    const updatedHistory = [...messages, { role: 'assistant' as const, content: response.content }];
    context.variables.set('__messages', updatedHistory);
    
    // 返回结果
    return {
      content: response.content,
      usage: response.usage,
      model: config.model || 'gpt-4o-mini',
    };
  }
  
  /**
   * 收集上游节点的输出
   */
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
  
  /**
   * 构建用户消息
   */
  private buildUserMessage(inputs: Record<string, unknown>): string {
    const inputValues = Object.values(inputs);
    
    if (inputValues.length === 0) {
      return '请开始任务。';
    }
    
    if (inputValues.length === 1) {
      const input = inputValues[0];
      if (typeof input === 'string') {
        return input;
      }
      if (typeof input === 'object' && input !== null) {
        return (input as any).content || JSON.stringify(input);
      }
      return String(input);
    }
    
    // 多个输入时合并
    return inputValues.map((input, index) => {
      const content = typeof input === 'object' && input !== null 
        ? ((input as any).content || JSON.stringify(input))
        : String(input);
      return `[输入 ${index + 1}]\n${content}`;
    }).join('\n\n');
  }
}
