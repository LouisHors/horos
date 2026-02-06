# Phase 6: 真实 Agent 执行器

## 目标
实现真正调用 OpenAI API 的节点执行器，让工作流能实际运行 AI 任务。

## 任务清单

### Task 1: 添加 OpenAI 依赖
- [ ] 在 execution 包添加 openai 依赖
- [ ] 配置环境变量类型定义

### Task 2: 创建 LLMService
- [ ] 封装 OpenAI API 调用
- [ ] 支持流式输出
- [ ] 支持函数调用

### Task 3: 实现 AgentNodeExecutor
- [ ] 读取 agent 配置（model, temperature, systemPrompt）
- [ ] 构建消息上下文
- [ ] 调用 LLMService
- [ ] 处理输出

### Task 4: 实现 ToolNodeExecutor  
- [ ] 支持常见工具（HTTP请求、代码执行等）
- [ ] 工具注册机制

### Task 5: 更新示例
- [ ] 创建可运行的示例工作流
- [ ] 添加环境变量配置说明

### Task 6: 测试验证
- [ ] 测试简单对话
- [ ] 测试流式输出
- [ ] 测试工具调用

## 架构

```
┌─────────────────────────────────────────┐
│           AgentNodeExecutor             │
│  ┌─────────────────────────────────┐   │
│  │         LLMService              │   │
│  │  ┌─────────────────────────┐   │   │
│  │  │      OpenAI API         │   │   │
│  │  │  - chat.completions     │   │   │
│  │  │  - streaming            │   │   │
│  │  │  - function calling     │   │   │
│  │  └─────────────────────────┘   │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```
