import {
  LLMProvider,
  LLMMessage,
  LLMRequest,
  LLMResponse,
  StreamCallback,
  ProviderConfig,
  LLMCapabilities,
} from './LLMProvider';

/**
 * Claude Provider (Anthropic)
 * 支持 Claude 3 系列模型
 */
export class ClaudeProvider implements LLMProvider {
  readonly name = 'Claude';
  readonly capabilities: LLMCapabilities = {
    streaming: true,
    functionCalling: true,
    vision: true,
    maxTokens: 200000,
  };

  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = {
      baseURL: 'https://api.anthropic.com/v1',
      timeout: 30000,
      ...config,
    };
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const response = await fetch(`${this.config.baseURL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: request.model,
        messages: this.convertMessages(request.messages),
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return {
      content: data.content[0]?.text || '',
      model: data.model,
      usage: data.usage ? {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      } : undefined,
      raw: data,
    };
  }

  async chatStream(
    request: LLMRequest,
    onChunk: StreamCallback
  ): Promise<LLMResponse> {
    const response = await fetch(`${this.config.baseURL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: request.model,
        messages: this.convertMessages(request.messages),
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${error}`);
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
            const content = parsed.delta?.text || '';
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
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Claude 的消息格式与 OpenAI 不同，需要转换
   */
  private convertMessages(messages: LLMMessage[]): any[] {
    // Claude 不支持 system 角色作为消息，需要特殊处理
    const result: any[] = [];
    
    for (const msg of messages) {
      if (msg.role === 'system') {
        // Claude 使用 system 参数而不是消息
        continue;
      }
      result.push({
        role: msg.role,
        content: msg.content,
      });
    }
    
    return result;
  }
}
