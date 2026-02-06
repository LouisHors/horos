# 工作流执行示例

此目录包含 @horos/execution 包的使用示例。

## 前置要求

1. 设置 OpenAI API Key:
```bash
export OPENAI_API_KEY="sk-your-api-key"
```

2. 如果使用第三方 API（可选）:
```bash
export OPENAI_BASE_URL="https://api.your-provider.com/v1"
```

## 运行示例

```bash
# 进入示例目录
cd examples

# 运行简单 Agent 工作流
npx tsx simple-agent-workflow.ts

# 运行工具工作流  
npx tsx tool-workflow.ts
```

## 示例说明

### simple-agent-workflow.ts
演示最基本的 AI 工作流：
- Start -> Agent -> End
- Agent 节点调用 OpenAI API
- 显示 Token 使用情况

### tool-workflow.ts
演示工具节点的使用：
- HTTP 请求工具
- 延迟工具
- 日志工具

## 创建自己的工作流

```typescript
import { ExecutionEngine, AgentNodeExecutor, NodeType } from '@horos/execution';

const engine = new ExecutionEngine();
engine.registerExecutor(NodeType.AGENT, new AgentNodeExecutor());

const result = await engine.execute(nodes, edges);
console.log(result);
```
