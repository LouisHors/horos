import { AgentRuntime } from "./agent-runtime";
import { db } from "@ai-agent/core/src/db";
import { agentInstances, agentDefinitions } from "@ai-agent/core/src/db/schema";
import { eq } from "drizzle-orm";

interface AgentConfig {
  name: string;
  role: string;
  description?: string;
  llmConfig: {
    provider: string;
    model: string;
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
  };
  tools: string[];
  workspaceId: string;
  createdBy: string;
}

interface RunningAgent {
  runtime: AgentRuntime;
  instanceId: string;
  promise: Promise<void>;
}

export class AgentManager {
  private runningAgents: Map<string, RunningAgent> = new Map();
  private maxConcurrentAgents: number;

  constructor(maxConcurrentAgents: number = 10) {
    this.maxConcurrentAgents = maxConcurrentAgents;
  }

  /**
   * 创建并启动 Agent
   */
  async createAndStartAgent(
    definitionId: string,
    config?: Partial<AgentConfig>
  ): Promise<string> {
    // 检查并发限制
    if (this.runningAgents.size >= this.maxConcurrentAgents) {
      throw new Error("Maximum concurrent agents reached");
    }

    // 获取 Agent 定义
    const definition = await db.query.agentDefinitions.findFirst({
      where: eq(agentDefinitions.id, definitionId),
    });

    if (!definition) {
      throw new Error(`Agent definition not found: ${definitionId}`);
    }

    // 创建 Agent 实例
    const [instance] = await db
      .insert(agentInstances)
      .values({
        definitionId: definitionId,
        workspaceId: definition.workspaceId,
        status: "idle",
        llmHistory: [],
      })
      .returning();

    // 创建运行时配置
    const runtimeConfig = {
      agentId: instance.id,
      llmConfig: config?.llmConfig || (definition.llmConfig as any),
      tools: config?.tools || (definition.tools as string[]) || [],
    };

    // 启动 Agent
    await this.startAgent(instance.id, runtimeConfig);

    return instance.id;
  }

  /**
   * 启动 Agent
   */
  async startAgent(
    instanceId: string,
    runtimeConfig: {
      agentId: string;
      llmConfig: any;
      tools: string[];
    }
  ): Promise<void> {
    if (this.runningAgents.has(instanceId)) {
      throw new Error(`Agent ${instanceId} is already running`);
    }

    // 更新状态为 running
    await db
      .update(agentInstances)
      .set({ status: "running" })
      .where(eq(agentInstances.id, instanceId));

    // 创建运行时
    const runtime = new AgentRuntime(runtimeConfig);

    // 启动运行循环
    const promise = runtime.run().catch(async (error) => {
      console.error(`[AgentManager] Agent ${instanceId} crashed:`, error);
      await db
        .update(agentInstances)
        .set({ status: "error" })
        .where(eq(agentInstances.id, instanceId));
      this.runningAgents.delete(instanceId);
    });

    this.runningAgents.set(instanceId, {
      runtime,
      instanceId,
      promise,
    });

    console.log(`[AgentManager] Agent ${instanceId} started`);
  }

  /**
   * 暂停 Agent
   */
  async pauseAgent(instanceId: string): Promise<void> {
    const runningAgent = this.runningAgents.get(instanceId);
    if (!runningAgent) {
      throw new Error(`Agent ${instanceId} is not running`);
    }

    runningAgent.runtime.pause();

    await db
      .update(agentInstances)
      .set({ status: "paused" })
      .where(eq(agentInstances.id, instanceId));

    console.log(`[AgentManager] Agent ${instanceId} paused`);
  }

  /**
   * 恢复 Agent
   */
  async resumeAgent(instanceId: string): Promise<void> {
    const runningAgent = this.runningAgents.get(instanceId);
    if (!runningAgent) {
      throw new Error(`Agent ${instanceId} is not running`);
    }

    runningAgent.runtime.resume();

    await db
      .update(agentInstances)
      .set({ status: "running" })
      .where(eq(agentInstances.id, instanceId));

    console.log(`[AgentManager] Agent ${instanceId} resumed`);
  }

  /**
   * 终止 Agent
   */
  async terminateAgent(instanceId: string): Promise<void> {
    const runningAgent = this.runningAgents.get(instanceId);
    if (!runningAgent) {
      throw new Error(`Agent ${instanceId} is not running`);
    }

    runningAgent.runtime.terminate();

    await db
      .update(agentInstances)
      .set({ status: "terminated" })
      .where(eq(agentInstances.id, instanceId));

    this.runningAgents.delete(instanceId);

    console.log(`[AgentManager] Agent ${instanceId} terminated`);
  }

  /**
   * 获取 Agent 状态
   */
  getAgentStatus(instanceId: string): string | null {
    const runningAgent = this.runningAgents.get(instanceId);
    if (!runningAgent) {
      return null;
    }
    return runningAgent.runtime.getStatus();
  }

  /**
   * 获取所有运行中的 Agent
   */
  getRunningAgents(): string[] {
    return Array.from(this.runningAgents.keys());
  }

  /**
   * 终止所有 Agent
   */
  async terminateAll(): Promise<void> {
    const ids = Array.from(this.runningAgents.keys());
    await Promise.all(ids.map((id) => this.terminateAgent(id)));
    console.log("[AgentManager] All agents terminated");
  }
}
