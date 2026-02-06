import type { LLMProvider, LLMMessage, LLMConfig, LLMResponse, StreamCallback } from './providers/LLMProvider';
import { ProviderFactory } from './providers/ProviderFactory';

export type { LLMMessage, LLMConfig, LLMResponse, StreamCallback };

/**
 * LLMService - 统一的大语言模型服务
 * 支持多提供商：OpenAI, Claude, DeepSeek, Moonshot, 等
 * 
 * 使用示例：
 * ```typescript
 * // 方式1: 使用默认 Provider (从环境变量)
 * const service = new LLMService();
 * 
 * // 方式2: 指定 Provider
 * const service = new LLMService('claude', {
 *   apiKey: 'your-claude-key',
 *   defaultModel: 'claude-3-sonnet-20240229'
 * });
 * 
 * // 方式3: 传入自定义 Provider
 * const service = new LLMService(customProvider);
 * ```
 */
export class LLMService {
  private provider: LLMProvider;

  constructor();
  constructor(provider: LLMProvider);
  constructor(type: string, config: { apiKey: string; baseURL?: string; defaultModel?: string });
  constructor(arg1?: LLMProvider | string, arg2?: { apiKey: string; baseURL?: string; defaultModel?: string }) {
    if (arg1 && typeof arg1 !== 'string') {
      // 直接传入 Provider 实例
      this.provider = arg1;
    } else if (arg1 && arg2) {
      // 传入类型和配置
      this.provider = ProviderFactory.createProvider(arg1 as any, arg2);
    } else {
      // 从环境变量创建
      this.provider = ProviderFactory.createFromEnv();
    }
  }

  /**
   * 发送聊天请求
   */
  async chat(
    messages: LLMMessage[],
    config?: Partial<LLMConfig>
  ): Promise<LLMResponse> {
    return this.provider.chat({
      model: config?.model || 'GLM-4.7',
      messages,
      temperature: config?.temperature ?? 0.7,
      maxTokens: config?.maxTokens || 2000,
    });
  }

  /**
   * 流式聊天
   */
  async chatStream(
    messages: LLMMessage[],
    onChunk: StreamCallback,
    config?: Partial<LLMConfig>
  ): Promise<LLMResponse> {
    return this.provider.chatStream(
      {
        model: config?.model || 'GLM-4.7',
        messages,
        temperature: config?.temperature ?? 0.7,
        maxTokens: config?.maxTokens || 2000,
      },
      onChunk
    );
  }

  /**
   * 简单完成（单轮对话）
   */
  async complete(prompt: string, config?: Partial<LLMConfig>): Promise<string> {
    const response = await this.chat(
      [{ role: 'user', content: prompt }],
      config
    );
    return response.content;
  }

  /**
   * 获取当前 Provider 信息
   */
  getProvider(): LLMProvider {
    return this.provider;
  }

  /**
   * 验证配置是否有效
   */
  async validate(): Promise<boolean> {
    return this.provider.validateConfig();
  }
}

// 导出单例（从环境变量初始化）
export const llmService = new LLMService();
