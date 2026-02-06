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
    console.log('[LLMService] 🔨 初始化...');
    if (arg1 && typeof arg1 !== 'string') {
      // 直接传入 Provider 实例
      this.provider = arg1;
      console.log('[LLMService] ✅ 使用传入的 Provider');
    } else if (arg1 && arg2) {
      // 传入类型和配置
      console.log('[LLMService] 🔧 从参数创建 Provider:', arg1);
      this.provider = ProviderFactory.createProvider(arg1 as any, arg2);
    } else {
      // 从环境变量创建
      console.log('[LLMService] 🔧 从环境变量创建 Provider');
      this.provider = ProviderFactory.createFromEnv();
    }
    console.log('[LLMService] ✅ Provider:', this.provider.name);
  }

  /**
   * 发送聊天请求
   */
  async chat(
    messages: LLMMessage[],
    config?: Partial<LLMConfig>
  ): Promise<LLMResponse> {
    const model = config?.model || 'GLM-4.7';
    console.log('[LLMService] 💬 chat()', { model, msgCount: messages.length });
    try {
      const result = await this.provider.chat({
        model,
        messages,
        temperature: config?.temperature ?? 0.7,
        maxTokens: config?.maxTokens || 2000,
      });
      console.log('[LLMService] ✅ chat() 成功', { contentLength: result.content.length });
      return result;
    } catch (err) {
      console.error('[LLMService] ❌ chat() 失败:', err);
      throw err;
    }
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
    console.log('[LLMService] 📝 complete()', { promptLength: prompt.length });
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

// 延迟初始化的单例 - 避免浏览器端模块加载时出错
let _llmService: LLMService | null = null;

export const llmService = new Proxy({} as LLMService, {
  get(_, prop) {
    if (!_llmService) {
      console.log('[LLMService] 🔄 延迟初始化单例');
      _llmService = new LLMService();
    }
    return (_llmService as any)[prop];
  }
});

// 兼容直接访问的 getter
export function getLLMService(): LLMService {
  if (!_llmService) {
    console.log('[LLMService] 🔄 延迟初始化单例 (getLLMService)');
    _llmService = new LLMService();
  }
  return _llmService;
}
