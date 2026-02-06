import { LLMProvider, ProviderConfig } from './LLMProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { ClaudeProvider } from './ClaudeProvider';

export type ProviderType = 'openai' | 'claude' | 'deepseek' | 'moonshot' | 'custom';

export interface ProviderInfo {
  type: ProviderType;
  name: string;
  defaultBaseURL: string;
  defaultModel: string;
  requireApiKey: boolean;
}

/**
 * 支持的提供商列表
 */
export const AVAILABLE_PROVIDERS: ProviderInfo[] = [
  {
    type: 'openai',
    name: 'OpenAI',
    defaultBaseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    requireApiKey: true,
  },
  {
    type: 'claude',
    name: 'Claude (Anthropic)',
    defaultBaseURL: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-5-sonnet-20241022',
    requireApiKey: true,
  },
  {
    type: 'deepseek',
    name: 'DeepSeek',
    defaultBaseURL: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    requireApiKey: true,
  },
  {
    type: 'moonshot',
    name: 'Moonshot (Kimi)',
    defaultBaseURL: 'https://api.kimi.com/coding/',
    defaultModel: 'kimi-coding',
    requireApiKey: true,
  },
  {
    type: 'custom',
    name: '自定义 (OpenAI 兼容)',
    defaultBaseURL: '',
    defaultModel: 'gpt-4o',
    requireApiKey: true,
  },
];

/**
 * Provider 工厂
 */
export class ProviderFactory {
  /**
   * 创建 Provider 实例
   */
  static createProvider(type: ProviderType, config: ProviderConfig): LLMProvider {
    switch (type) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'claude':
        return new ClaudeProvider(config);
      case 'deepseek':
      case 'moonshot':
      case 'custom':
        // 这些提供商都兼容 OpenAI API 格式
        return new OpenAIProvider(config);
      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
  }

  /**
   * 从环境变量创建 Provider
   * 默认使用 Moonshot Kimi 模型
   */
  static createFromEnv(): LLMProvider {
    const type = (process.env.LLM_PROVIDER as ProviderType) || 'moonshot';
    const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || '';
    const baseURL = process.env.LLM_BASE_URL || 'https://api.kimi.com/coding/';
    const defaultModel = process.env.LLM_MODEL || 'kimi-coding';

    if (!apiKey) {
      throw new Error('LLM API Key not found. Set LLM_API_KEY or OPENAI_API_KEY environment variable.');
    }

    return this.createProvider(type, {
      apiKey,
      baseURL,
      defaultModel,
    });
  }
}

declare const process: {
  env: Record<string, string | undefined>;
};
