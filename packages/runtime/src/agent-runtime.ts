import { db, redis } from "@ai-agent/core/src/db";
import { agentInstances, messages } from "@ai-agent/core/src/db/schema";
import { eq } from "drizzle-orm";
import { MessageService } from "./message-service";

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

  constructor(config: AgentRuntimeConfig) {
    this.agentId = config.agentId;
    this.config = config;
    this.messageService = new MessageService();
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
