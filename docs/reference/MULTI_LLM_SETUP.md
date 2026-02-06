# 多 LLM 提供商配置指南

Horos 支持多种大语言模型提供商，**默认使用 Moonshot Kimi 的 coding 模型**。

## 🌟 默认配置（推荐）

**默认使用 Kimi (Moonshot) `kimi-coding` 模型**

```bash
export LLM_API_KEY="sk-your-moonshot-key"
# 搞定！其他都不用配
```

Kimi 的优势：
- ✅ 超长上下文（128K）
- ✅ 中文理解能力顶尖
- ✅ 代码生成能力强（kimi-coding）
- ✅ 国内访问稳定

---

## 支持的提供商

| 提供商 | 类型 | 默认模型 | 说明 |
|--------|------|----------|------|
| **Moonshot** ⭐ | `moonshot` | `kimi-coding` | 默认，代码能力强 |
| OpenAI | `openai` | `gpt-4o` | OpenAI 官方 |
| Claude | `claude` | `claude-3-5-sonnet-20241022` | Anthropic |
| DeepSeek | `deepseek` | `deepseek-chat` | 深度求索 |
| 自定义 | `custom` | `gpt-4o` | 任意兼容 API |

---

## 配置示例

### Moonshot (Kimi) - 默认，无需配置 PROVIDER

```bash
export LLM_API_KEY="sk-your-moonshot-key"
# 使用默认 kimi-coding 模型
```

使用特定模型：
```bash
export LLM_API_KEY="sk-your-moonshot-key"
export LLM_MODEL="moonshot-v1-128k"  # 或 moonshot-v1-32k
```

### OpenAI

```bash
export LLM_PROVIDER=openai
export LLM_API_KEY="sk-your-openai-key"
export LLM_MODEL="gpt-4o"  # 可选，默认 gpt-4o
```

### Claude

```bash
export LLM_PROVIDER=claude
export LLM_API_KEY="sk-ant-your-claude-key"
export LLM_MODEL="claude-3-5-sonnet-20241022"
```

### DeepSeek

```bash
export LLM_PROVIDER=deepseek
export LLM_API_KEY="sk-your-deepseek-key"
export LLM_MODEL="deepseek-chat"
```

### 自定义 OpenAI 兼容 API

```bash
export LLM_PROVIDER=custom
export LLM_API_KEY="your-api-key"
export LLM_BASE_URL="https://your-api-endpoint.com/v1"
export LLM_MODEL="your-model-name"
```

---

## 架构说明

```
┌─────────────────────────────────────────┐
│           LLMService                    │
│  ┌───────────────────────────────────┐ │
│  │  ProviderFactory                  │ │
│  │  ┌─────────┐ ┌─────────┐         │ │
│  │  │ Moonshot│ │ OpenAI  │ ┌─────┐ │ │
│  │  │(默认)   │ │ 兼容    │ │Claude│ │ │
│  │  └────┬────┘ └────┬────┘ └──┬──┘ │ │
│  │       └───────────┴─────────┘     │ │
│  │              │                     │ │
│  │         OpenAI 兼容 API 格式       │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

两种 API 格式：
1. **OpenAI 兼容格式** - Moonshot, DeepSeek, 大多数国产模型
2. **Anthropic 格式** - Claude 专用

---

## 代码中使用

### 方式1: 环境变量自动加载（默认 Kimi）

```typescript
import { LLMService } from '@horos/execution';

const service = new LLMService();
const result = await service.complete("写个快速排序");
// 使用 kimi-coding 模型回复
```

### 方式2: 显式指定提供商

```typescript
import { LLMService } from '@horos/execution';

const service = new LLMService('openai', {
  apiKey: 'sk-your-key',
  defaultModel: 'gpt-4o'
});
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

---

**🎉 默认就是最强的 Kimi coding 模型！**
