declare const process: {
  env: Record<string, string | undefined>;
};

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
  baseURL?: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export type StreamCallback = (chunk: string) => void;

/**
 * LLMService - 大语言模型服务封装
 * 使用 OpenAI 兼容的 API 格式
 */
export class LLMService {
  private apiKey: string;
  private baseURL: string;
  private defaultConfig: Omit<LLMConfig, 'apiKey' | 'baseURL'>;

  constructor(config?: LLMConfig) {
    this.apiKey = config?.apiKey || process.env.OPENAI_API_KEY || '';
    this.baseURL = config?.baseURL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    
    this.defaultConfig = {
      model: config?.model || 'gpt-4o-mini',
      temperature: config?.temperature ?? 0.7,
      maxTokens: config?.maxTokens || 2000,
    };
  }

  /**
   * 发送聊天请求
   */
  async chat(
    messages: LLMMessage[],
    config?: Partial<LLMConfig>
  ): Promise<LLMResponse> {
    const mergedConfig = { ...this.defaultConfig, ...config };
    
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: mergedConfig.model,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          temperature: mergedConfig.temperature,
          max_tokens: mergedConfig.maxTokens,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const choice = data.choices[0];
      
      return {
        content: choice.message.content || '',
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        } : undefined,
      };
    } catch (error) {
      console.error('LLM chat error:', error);
      throw new Error(`LLM request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    const mergedConfig = { ...this.defaultConfig, ...config };
    
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: mergedConfig.model,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          temperature: mergedConfig.temperature,
          max_tokens: mergedConfig.maxTokens,
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API error: ${response.status} - ${error}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      let fullContent = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              if (content) {
                fullContent += content;
                onChunk(content);
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }

      return {
        content: fullContent,
      };
    } catch (error) {
      console.error('LLM stream error:', error);
      throw new Error(`LLM stream failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
}

// 导出单例
export const llmService = new LLMService();
