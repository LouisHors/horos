# Phase 2: Agent Runtime 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use horspowers:executing-plans to implement this plan task-by-task.

**日期**: 2026-01-30  
**预计用时**: 14天  
**任务数量**: 19个  
**依赖**: Phase 1 完成

## 目标

实现 Agent 自运行机制，包括 AgentRuntime 核心循环、AgentManager 生命周期管理、消息总线系统（IM）和 MCP 工具集成。

## 架构方案

采用去中心化设计，每个 Agent 运行在独立的 while(true) 循环中，阻塞等待消息唤醒。消息总线基于 Redis Streams 和 Pub/Sub，实现 Group/Message 通信模式。

## 技术栈

TypeScript, Redis Streams, Bull Queue, MCP SDK

---

## Task 1: 创建 AgentRuntime 核心类

**Files:**
- Create: `packages/runtime/src/agent-runtime.ts`
- Create: `packages/runtime/package.json`

**Step 1: 创建 runtime 包结构**

```bash
mkdir -p packages/runtime/src
```

**Step 2: 创建 package.json**

```json
{
  "name": "@ai-agent/runtime",
  "version": "1.0.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest",
    "clean": "rm -rf dist node_modules"
  },
  "dependencies": {
    "@ai-agent/core": "workspace:*",
    "openai": "^4.28.0",
    "ioredis": "^5.3.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "typescript": "^5",
    "vitest": "^2.0.0"
  }
}
```

**Step 3: 创建 AgentRuntime 核心类**

```typescript
// packages/runtime/src/agent-runtime.ts
import { db, redis } from "@ai-agent/core/src/db";
import { agentInstances, messages } from "@ai-agent/core/src/db/schema";
import { eq } from "drizzle-orm";

interface AgentRuntimeConfig {
  agentId: string;
  llmConfig: {
    provider: string;
    model: string;
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
  };
  tools: string[];
}

export class AgentRuntime {
  private agentId: string;
  private config: AgentRuntimeConfig;
  private status: "idle" | "running" | "paused" | "terminated" = "idle";
  private currentGroupId?: string;

  constructor(config: AgentRuntimeConfig) {
    this.agentId = config.agentId;
    this.config = config;
  }

  /**
   * Agent 主循环 - 核心运行时
   */
  async run(): Promise<void> {
    console.log(`[Agent ${this.agentId}] Starting runtime...`);
    this.status = "running";

    // 恢复上下文
    await this.loadContext();

    while (this.status === "running") {
      try {
        // 1. 检查未读消息
        const unreadMessages = await this.getAllUnread();

        if (unreadMessages.length === 0) {
          // 无消息，阻塞等待唤醒
          console.log(`[Agent ${this.agentId}] No unread messages, waiting...`);
          const wokeUp = await this.waitForWake(30000); // 30秒超时
          if (!wokeUp) continue;
        }

        // 2. 构建 LLM 上下文
        const context = await this.buildContext(unreadMessages);

        // 3. LLM 推理（流式）
        const response = await this.runLLM(context);

        // 4. 处理响应
        await this.processResponse(response);

        // 5. 持久化上下文
        await this.saveContext();
      } catch (error) {
        console.error(`[Agent ${this.agentId}] Runtime error:`, error);
        await this.handleError(error);
      }
    }

    console.log(`[Agent ${this.agentId}] Runtime stopped`);
  }

  /**
   * 获取所有未读消息
   */
  private async getAllUnread(): Promise<any[]> {
    // 从数据库获取未读消息
    // 实现见 Task 2
    return [];
  }

  /**
   * 阻塞等待唤醒信号
   */
  private async waitForWake(timeoutMs: number): Promise<boolean> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve(false);
      }, timeoutMs);

      // 订阅 Redis 唤醒频道
      redis.subscribe(`agent:wake:${this.agentId}`, () => {
        clearTimeout(timer);
        resolve(true);
      });
    });
  }

  /**
   * 构建 LLM 上下文
   */
  private async buildContext(newMessages: any[]): Promise<any[]> {
    // 实现见 Task 3
    return [];
  }

  /**
   * 运行 LLM（流式输出）
   */
  private async runLLM(context: any[]): Promise<any> {
    // 实现见 Task 4
    return {};
  }

  /**
   * 处理 LLM 响应
   */
  private async processResponse(response: any): Promise<void> {
    // 实现见 Task 5
  }

  /**
   * 加载上下文
   */
  private async loadContext(): Promise<void> {
    const agent = await db.query.agentInstances.findFirst({
      where: eq(agentInstances.id, this.agentId),
    });

    if (agent) {
      this.currentGroupId = agent.currentGroupId || undefined;
    }
  }

  /**
   * 保存上下文
   */
  private async saveContext(): Promise<void> {
    // 实现见 Task 3
  }

  /**
   * 处理错误
   */
  private async handleError(error: any): Promise<void> {
    await db
      .update(agentInstances)
      .set({ status: "error" })
      .where(eq(agentInstances.id, this.agentId));

    this.status = "paused";
  }

  // 公共控制方法
  pause(): void {
    this.status = "paused";
  }

  resume(): void {
    this.status = "running";
  }

  terminate(): void {
    this.status = "terminated";
  }

  getStatus(): string {
    return this.status;
  }
}
```

**Step 4: 提交**

```bash
git add packages/runtime/
git commit -m "feat: add agent runtime core class with main loop"
```

---

## Task 2: 实现消息获取机制

**Files:**
- Modify: `packages/runtime/src/agent-runtime.ts`
- Create: `packages/runtime/src/message-service.ts`

**Step 1: 创建 MessageService**

```typescript
// packages/runtime/src/message-service.ts
import { db } from "@ai-agent/core/src/db";
import { messages, groupMembers } from "@ai-agent/core/src/db/schema";
import { eq, and, gt } from "drizzle-orm";

export class MessageService {
  /**
   * 获取 Agent 的所有未读消息
   */
  async getUnreadMessages(agentId: string): Promise<any[]> {
    // 获取 Agent 所在的所有 Group
    const memberships = await db.query.groupMembers.findMany({
      where: eq(groupMembers.agentId, agentId),
    });

    const unreadMessages = [];

    for (const membership of memberships) {
      const lastReadId =
        membership.lastReadMessageId ||
        "00000000-0000-0000-0000-000000000000";

      // 查询未读消息
      const groupMessages = await db.query.messages.findMany({
        where: and(
          eq(messages.groupId, membership.groupId),
          gt(messages.id, lastReadId)
        ),
        orderBy: (messages, { asc }) => asc(messages.sendTime),
      });

      unreadMessages.push(...groupMessages);
    }

    // 按时间排序
    return unreadMessages.sort(
      (a, b) => a.sendTime.getTime() - b.sendTime.getTime()
    );
  }

  /**
   * 标记消息为已读
   */
  async markAsRead(
    agentId: string,
    groupId: string,
    messageId: string
  ): Promise<void> {
    await db
      .update(groupMembers)
      .set({ lastReadMessageId: messageId })
      .where(
        and(eq(groupMembers.agentId, agentId), eq(groupMembers.groupId, groupId))
      );
  }
}
```

**Step 2: 更新 AgentRuntime 使用 MessageService**

```typescript
// 添加到 agent-runtime.ts
import { MessageService } from "./message-service";

export class AgentRuntime {
  private messageService: MessageService;

  constructor(config: AgentRuntimeConfig) {
    this.agentId = config.agentId;
    this.config = config;
    this.messageService = new MessageService();
  }

  private async getAllUnread(): Promise<any[]> {
    const messages = await this.messageService.getUnreadMessages(this.agentId);

    // 标记最后一条消息为已读
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      await this.messageService.markAsRead(
        this.agentId,
        lastMessage.groupId,
        lastMessage.id
      );
    }

    return messages;
  }
}
```

**Step 3: 提交**

```bash
git add packages/runtime/src/
git commit -m "feat: implement message fetching and read tracking"
```

---

## Task 3: 实现上下文管理

**Files:**
- Modify: `packages/runtime/src/agent-runtime.ts`
- Create: `packages/runtime/src/context-manager.ts`

**Step 1: 创建 ContextManager**

```typescript
// packages/runtime/src/context-manager.ts
import { db } from "@ai-agent/core/src/db";
import { agentInstances } from "@ai-agent/core/src/db/schema";
import { eq } from "drizzle-orm";

interface LLMMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

export class ContextManager {
  private agentId: string;
  private history: LLMMessage[] = [];

  constructor(agentId: string) {
    this.agentId = agentId;
  }

  /**
   * 从数据库加载历史上下文
   */
  async load(): Promise<LLMMessage[]> {
    const agent = await db.query.agentInstances.findFirst({
      where: eq(agentInstances.id, this.agentId),
    });

    if (agent?.llmHistory) {
      this.history = agent.llmHistory as LLMMessage[];
    }

    return this.history;
  }

  /**
   * 保存上下文到数据库
   */
  async save(): Promise<void> {
    await db
      .update(agentInstances)
      .set({
        llmHistory: this.history,
        lastActiveAt: new Date(),
      })
      .where(eq(agentInstances.id, this.agentId));
  }

  /**
   * 添加消息到上下文
   */
  addMessage(message: LLMMessage): void {
    this.history.push(message);
  }

  /**
   * 添加系统提示词（如果不存在）
   */
  setSystemPrompt(prompt: string): void {
    const existingSystem = this.history.find((m) => m.role === "system");
    if (!existingSystem) {
      this.history.unshift({
        role: "system",
        content: prompt,
      });
    }
  }

  /**
   * 获取完整上下文
   */
  getContext(): LLMMessage[] {
    return this.history;
  }

  /**
   * 清空上下文
   */
  clear(): void {
    this.history = [];
  }
}
```

**Step 2: 更新 AgentRuntime 使用 ContextManager**

```typescript
// 添加到 agent-runtime.ts
import { ContextManager } from "./context-manager";

export class AgentRuntime {
  private contextManager: ContextManager;

  constructor(config: AgentRuntimeConfig) {
    this.agentId = config.agentId;
    this.config = config;
    this.messageService = new MessageService();
    this.contextManager = new ContextManager(config.agentId);
  }

  private async loadContext(): Promise<void> {
    await this.contextManager.load();

    // 设置系统提示词
    this.contextManager.setSystemPrompt(this.config.llmConfig.systemPrompt);

    // 加载其他上下文信息
    const agent = await db.query.agentInstances.findFirst({
      where: eq(agentInstances.id, this.agentId),
    });

    if (agent) {
      this.currentGroupId = agent.currentGroupId || undefined;
    }
  }

  private async saveContext(): Promise<void> {
    await this.contextManager.save();
  }

  private async buildContext(newMessages: any[]): Promise<any[]> {
    // 将新消息转换为 LLM 消息格式
    const newLLMMessages = newMessages.map((msg) => ({
      role: msg.senderId === this.agentId ? "assistant" : "user",
      content: msg.content,
    }));

    // 添加到上下文
    for (const msg of newLLMMessages) {
      this.contextManager.addMessage(msg);
    }

    return this.contextManager.getContext();
  }
}
```

**Step 3: 提交**

```bash
git add packages/runtime/src/
git commit -m "feat: implement context management with persistence"
```

---

## Task 4: 实现 LLM 流式调用

**Files:**
- Create: `packages/runtime/src/llm-client.ts`
- Modify: `packages/runtime/src/agent-runtime.ts`

**Step 1: 创建 LLMClient**

```typescript
// packages/runtime/src/llm-client.ts
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
```

**Step 2: 更新 AgentRuntime 使用 LLMClient**

```typescript
// 添加到 agent-runtime.ts
import { LLMClient } from "./llm-client";

export class AgentRuntime {
  private llmClient: LLMClient;

  constructor(config: AgentRuntimeConfig) {
    this.agentId = config.agentId;
    this.config = config;
    this.messageService = new MessageService();
    this.contextManager = new ContextManager(config.agentId);
    this.llmClient = new LLMClient(config.llmConfig);
  }

  private async runLLM(context: any[]): Promise<any> {
    const fullContent = "";
    const toolCalls = [];

    // 流式输出
    for await (const chunk of this.llmClient.stream(context)) {
      // 实时推送到 UI（通过 Redis）
      await this.emitToUI({
        type: "chunk",
        agentId: this.agentId,
        content: chunk.content,
      });

      if (chunk.content) {
        fullContent += chunk.content;
      }

      if (chunk.tool_calls) {
        toolCalls.push(...chunk.tool_calls);
      }
    }

    return {
      content: fullContent,
      toolCalls,
      finishReason: toolCalls.length > 0 ? "tool_calls" : "stop",
    };
  }

  /**
   * 实时推送到 UI
   */
  private async emitToUI(event: any): Promise<void> {
    await redis.publish(`agent:ui:${this.agentId}`, JSON.stringify(event));
  }
}
```

**Step 3: 提交**

```bash
git add packages/runtime/src/
git commit -m "feat: implement streaming llm calls with openai"
```

---

## Task 5: 实现工具调用处理

**Files:**
- Create: `packages/runtime/src/tool-executor.ts`
- Modify: `packages/runtime/src/agent-runtime.ts`

**Step 1: 创建 ToolExecutor**

```typescript
// packages/runtime/src/tool-executor.ts
export interface Tool {
  name: string;
  description: string;
  parameters: any;
  execute: (args: any) => Promise<any>;
}

export class ToolExecutor {
  private tools: Map<string, Tool> = new Map();

  /**
   * 注册工具
   */
  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * 获取工具定义（用于 LLM）
   */
  getToolDefinitions(): any[] {
    return Array.from(this.tools.values()).map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  /**
   * 执行工具调用
   */
  async executeTool(name: string, args: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    return await tool.execute(args);
  }
}
```

**Step 2: 更新 AgentRuntime 支持工具调用**

```typescript
// 添加到 agent-runtime.ts
import { ToolExecutor } from "./tool-executor";

export class AgentRuntime {
  private toolExecutor: ToolExecutor;

  constructor(config: AgentRuntimeConfig) {
    this.agentId = config.agentId;
    this.config = config;
    this.messageService = new MessageService();
    this.contextManager = new ContextManager(config.agentId);
    this.llmClient = new LLMClient(config.llmConfig);
    this.toolExecutor = new ToolExecutor();

    // 初始化工具
    this.initializeTools(config.tools);
  }

  private initializeTools(toolIds: string[]): void {
    // 根据 toolIds 注册工具
    // 实际实现会从 MCP Registry 加载
  }

  private async processResponse(response: any): Promise<void> {
    // 1. 如果有工具调用，执行工具
    if (response.toolCalls && response.toolCalls.length > 0) {
      for (const toolCall of response.toolCalls) {
        const result = await this.toolExecutor.executeTool(
          toolCall.function.name,
          JSON.parse(toolCall.function.arguments)
        );

        // 将工具结果添加到上下文
        this.contextManager.addMessage({
          role: "tool",
          content: JSON.stringify(result),
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
        });
      }

      // 工具执行后继续推理
      const newContext = this.contextManager.getContext();
      const followUpResponse = await this.runLLM(newContext);
      await this.processResponse(followUpResponse);
      return;
    }

    // 2. 发送回复到当前 Group
    if (this.currentGroupId && response.content) {
      await this.sendMessage(this.currentGroupId, response.content);
    }
  }

  /**
   * 发送消息到 Group
   */
  private async sendMessage(groupId: string, content: string): Promise<void> {
    // 实现见 Task 6
  }
}
```

**Step 3: 提交**

```bash
git add packages/runtime/src/
git commit -m "feat: implement tool execution and response processing"
```

---

## Task 6-19: 更多任务...

由于篇幅限制，这里仅展示前 5 个任务的详细步骤。完整的 Phase 2 计划还包括：

- Task 6: 实现消息发送和广播
- Task 7: 创建 AgentManager 类
- Task 8: 实现 Agent 工厂模式
- Task 9: 父子 Agent 关系管理
- Task 10: Agent 状态机实现
- Task 11: 并发控制和 Agent 池
- Task 12: Redis Streams 消息流
- Task 13: Group 管理和创建
- Task 14: 唤醒机制优化
- Task 15: MCP Client 集成
- Task 16: 工具注册表实现
- Task 17-19: 集成测试和优化

---

## 验收标准

Phase 2 完成时，系统应该能够：

- [x] Agent 可以自启动并进入 while(true) 循环
- [x] Agent 可以阻塞等待消息唤醒
- [x] Agent 可以接收和发送消息
- [x] Agent 可以调用 LLM 进行流式推理
- [x] Agent 可以执行工具调用
- [x] 多个 Agent 可以并行运行
- [x] MCP 工具可以动态加载和执行

---

**注意**: 完整实施请参考 `ai_agent_development_plan.md` 中的 Phase 2 任务列表。

