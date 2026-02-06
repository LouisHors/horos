/**
 * LLMProvider - 通用大语言模型提供者接口
 * 支持 OpenAI、Claude、Gemini、DeepSeek 等任意提供商
 */

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  model: string;
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  [key: string]: unknown; // 其他提供商特有参数
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
  raw?: unknown; // 原始响应
}

export type StreamCallback = (chunk: string) => void;

export interface LLMCapabilities {
  streaming: boolean;
  functionCalling: boolean;
  vision: boolean;
  maxTokens: number;
}

/**
 * LLMProvider 抽象接口
 */
export interface LLMProvider {
  /** 提供者名称 */
  readonly name: string;
  
  /** 能力声明 */
  readonly capabilities: LLMCapabilities;
  
  /**
   * 发送聊天请求
   */
  chat(request: LLMRequest): Promise<LLMResponse>;
  
  /**
   * 流式聊天
   */
  chatStream(
    request: LLMRequest,
    onChunk: StreamCallback
  ): Promise<LLMResponse>;
  
  /**
   * 验证配置是否有效
   */
  validateConfig(): Promise<boolean>;
  
  /**
   * 获取可用模型列表
   */
  listModels?(): Promise<string[]>;
}

/**
 * 基础 Provider 配置
 */
export interface ProviderConfig {
  apiKey: string;
  baseURL?: string;
  defaultModel?: string;
  timeout?: number;
}

/**
 * LLM 配置（用于请求）
 */
export interface LLMConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
  baseURL?: string;
}
