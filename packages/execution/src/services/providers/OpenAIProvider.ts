import {
  LLMProvider,
  LLMRequest,
  LLMResponse,
  StreamCallback,
  ProviderConfig,
  LLMCapabilities,
} from './LLMProvider';

/**
 * OpenAI Provider
 * 支持 OpenAI 及兼容 OpenAI API 格式的服务商
 * (如: DeepSeek, Moonshot, Qwen, 等)
 */
export class OpenAIProvider implements LLMProvider {
  readonly name: string;
  readonly capabilities: LLMCapabilities = {
    streaming: true,
    functionCalling: true,
    vision: true,
    maxTokens: 128000,
  };

  private config: ProviderConfig;

  constructor(config: ProviderConfig, name?: string) {
    this.config = {
      timeout: 30000,
      ...config,
    };
    // 根据 baseURL 自动识别名称
    this.name = name || this.detectProviderName(config.baseURL);
  }

  private detectProviderName(baseURL?: string): string {
    if (!baseURL) return 'OpenAI';
    if (baseURL.includes('kimi')) return 'Moonshot';
    if (baseURL.includes('moonshot')) return 'Moonshot';
    if (baseURL.includes('deepseek')) return 'DeepSeek';
    if (baseURL.includes('openai')) return 'OpenAI';
    return 'Custom';
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const response = await fetch(`${this.config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return this.parseResponse(data);
  }

  async chatStream(
    request: LLMRequest,
    onChunk: StreamCallback
  ): Promise<LLMResponse> {
    const response = await fetch(`${this.config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
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
      model: request.model,
    };
  }

  async validateConfig(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private parseResponse(data: any): LLMResponse {
    const choice = data.choices[0];
    return {
      content: choice.message.content || '',
      model: data.model,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
      raw: data,
    };
  }
}
