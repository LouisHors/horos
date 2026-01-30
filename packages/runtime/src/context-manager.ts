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
