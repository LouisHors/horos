# 多 LLM 提供商配置指南

Horos 现在支持多种大语言模型提供商：

## 支持的提供商

| 提供商 | 类型 | 说明 |
|--------|------|------|
| OpenAI | `openai` | GPT-4, GPT-3.5 系列 |
| Claude | `claude` | Anthropic Claude 3 系列 |
| DeepSeek | `deepseek` | 深度求索 |
| Moonshot | `moonshot` | 月之暗面 Kimi |
| 自定义 | `custom` | 任意 OpenAI 兼容 API |

---

## 环境变量配置

### OpenAI (默认)

```bash
export LLM_PROVIDER=openai
export LLM_API_KEY="sk-your-openai-key"
export LLM_MODEL="gpt-4o-mini"
# 可选
export LLM_BASE_URL="https://api.openai.com/v1"
```

### Claude

```bash
export LLM_PROVIDER=claude
export LLM_API_KEY="sk-ant-your-claude-key"
export LLM_MODEL="claude-3-sonnet-20240229"
```

### DeepSeek

```bash
export LLM_PROVIDER=deepseek
export LLM_API_KEY="sk-your-deepseek-key"
export LLM_MODEL="deepseek-chat"
export LLM_BASE_URL="https://api.deepseek.com/v1"
```

### Moonshot (Kimi)

```bash
export LLM_PROVIDER=moonshot
export LLM_API_KEY="sk-your-moonshot-key"
export LLM_MODEL="moonshot-v1-8k"
export LLM_BASE_URL="https://api.moonshot.cn/v1"
```

### 自定义 OpenAI 兼容 API

```bash
export LLM_PROVIDER=custom
export LLM_API_KEY="your-api-key"
export LLM_BASE_URL="https://your-api-endpoint.com/v1"
export LLM_MODEL="your-model-name"
```

---

## 代码中使用

### 方式1: 环境变量自动加载

```typescript
import { LLMService } from '@horos/execution';

const service = new LLMService();
const result = await service.complete("你好");
```

### 方式2: 显式指定提供商

```typescript
import { LLMService } from '@horos/execution';

const service = new LLMService('claude', {
  apiKey: 'sk-ant-your-key',
  defaultModel: 'claude-3-sonnet-20240229'
});

const result = await service.chat([
  { role: 'user', content: '你好' }
]);
```

### 方式3: 自定义 Provider

```typescript
import { LLMService, OpenAIProvider } from '@horos/execution';

const provider = new OpenAIProvider({
  apiKey: 'your-key',
  baseURL: 'https://custom-api.com/v1',
  defaultModel: 'custom-model'
});

const service = new LLMService(provider);
```

---

## 流式输出

所有提供商都支持流式输出：

```typescript
await service.chatStream(
  [{ role: 'user', content: '讲个故事' }],
  (chunk) => {
    process.stdout.write(chunk); // 逐字输出
  }
);
```

---

## 验证配置

```typescript
const isValid = await service.validate();
console.log('配置有效:', isValid);
```
