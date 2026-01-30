import { db, redis } from "@ai-agent/core/src/db";
import { agentInstances, messages } from "@ai-agent/core/src/db/schema";
import { eq } from "drizzle-orm";
import { MessageService } from "./message-service";
import { ContextManager } from "./context-manager";
import { LLMClient } from "./llm-client";
import { ToolExecutor } from "./tool-executor";

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
  private messageService: MessageService;
  private contextManager: ContextManager;
  private llmClient: LLMClient;
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

  /**
   * 运行 LLM（流式输出）
   */
  private async runLLM(context: any[]): Promise<any> {
    let fullContent = "";
    const toolCalls: any[] = [];

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

  /**
   * 处理 LLM 响应
   */
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
    console.log(`[Agent ${this.agentId}] Sending message to group ${groupId}: ${content}`);
  }

  /**
   * 加载上下文
   */
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

  /**
   * 保存上下文
   */
  private async saveContext(): Promise<void> {
    await this.contextManager.save();
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
