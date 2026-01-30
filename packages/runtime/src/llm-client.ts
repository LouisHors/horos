import OpenAI from "openai";

interface LLMConfig {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

interface LLMMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

export class LLMClient {
  private client: OpenAI;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * 流式调用 LLM
   */
  async *stream(messages: LLMMessage[], tools?: any[]): AsyncGenerator<any> {
    const stream = await this.client.chat.completions.create({
      model: this.config.model,
      messages: messages as any,
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
      tools: tools,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;

      if (delta?.content) {
        yield {
          type: "content",
          content: delta.content,
        };
      }

      if (delta?.tool_calls) {
        yield {
          type: "tool_calls",
          tool_calls: delta.tool_calls,
        };
      }
    }
  }

  /**
   * 非流式调用（用于简单场景）
   */
  async complete(messages: LLMMessage[], tools?: any[]): Promise<any> {
    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages: messages as any,
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
      tools: tools,
    });

    return response.choices[0].message;
  }
}
