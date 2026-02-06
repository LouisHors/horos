import { LLMProvider, LLMRequest, LLMResponse, ProviderConfig, StreamCallback } from './LLMProvider';

/**
 * MockProvider - 用于测试的模拟 LLM Provider
 * 不调用真实 API，直接返回模拟响应
 */
export class MockProvider implements LLMProvider {
  readonly name = 'Mock Provider';
  readonly capabilities = { 
    streaming: false, 
    functionCalling: false, 
    vision: false, 
    maxTokens: 4096 
  };
  
  config: ProviderConfig;
  
  constructor(config: ProviderConfig) {
    console.log('[MockProvider] 🔨 创建实例');
    this.config = {
      ...config,
      defaultModel: config.defaultModel || 'mock-model',
    };
  }
  
  async chat(request: LLMRequest): Promise<LLMResponse> {
    console.log('[MockProvider] 💬 chat()', { model: request.model, msgCount: request.messages.length });
    
    const lastMessage = request.messages[request.messages.length - 1];
    const content = `【模拟响应】收到消息: "${lastMessage.content.slice(0, 50)}..."\n\n这是一个测试响应，用于验证工作流执行流程。`;
    
    console.log('[MockProvider] ✅ 返回模拟响应');
    return {
      content,
      model: request.model || this.config.defaultModel,
      usage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      },
    };
  }
  
  async chatStream(request: LLMRequest, onChunk: StreamCallback): Promise<LLMResponse> {
    console.log('[MockProvider] 💬 chatStream()');
    const content = '【模拟流式响应】这是一个测试响应。';
    onChunk(content, false);
    onChunk('', true);
    
    return {
      content,
      model: request.model || this.config.defaultModel,
      usage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      },
    };
  }
  
  async validateConfig(): Promise<boolean> {
    return true;
  }
}
