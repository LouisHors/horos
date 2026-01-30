import { AgentManager } from "./agent-manager";
import { AgentRuntime } from "./agent-runtime";

interface PoolConfig {
  maxSize: number;
  minSize: number;
  idleTimeoutMs: number;
}

interface PooledAgent {
  runtime: AgentRuntime;
  instanceId: string;
  createdAt: Date;
  lastUsedAt: Date;
  useCount: number;
}

/**
 * Agent 连接池
 * 
 * 用于管理大量短生命周期 Agent 的创建和复用
 */
export class AgentPool {
  private config: PoolConfig;
  private availableAgents: PooledAgent[] = [];
  private inUseAgents: Map<string, PooledAgent> = new Map();
  private agentManager: AgentManager;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(agentManager: AgentManager, config: Partial<PoolConfig> = {}) {
    this.agentManager = agentManager;
    this.config = {
      maxSize: config.maxSize || 20,
      minSize: config.minSize || 5,
      idleTimeoutMs: config.idleTimeoutMs || 300000, // 5分钟
    };

    // 启动清理定时器
    this.startCleanup();
  }

  /**
   * 从池中获取 Agent
   */
  async acquire(definitionId: string): Promise<string> {
    // 先尝试从可用列表中查找匹配的 Agent
    const index = this.availableAgents.findIndex(
      (agent) => agent.runtime.getStatus() === "idle"
    );

    if (index >= 0) {
      const agent = this.availableAgents.splice(index, 1)[0];
      agent.lastUsedAt = new Date();
      agent.useCount++;
      this.inUseAgents.set(agent.instanceId, agent);
      return agent.instanceId;
    }

    // 检查是否达到最大数量
    if (this.inUseAgents.size + this.availableAgents.length >= this.config.maxSize) {
      throw new Error("Agent pool exhausted");
    }

    // 创建新的 Agent
    const instanceId = await this.agentManager.createAndStartAgent(definitionId);
    
    // 这里需要获取 runtime，但 AgentManager 没有提供获取方法
    // 实际实现需要调整 AgentManager 的接口
    
    return instanceId;
  }

  /**
   * 归还 Agent 到池中
   */
  async release(instanceId: string): Promise<void> {
    const agent = this.inUseAgents.get(instanceId);
    if (!agent) {
      throw new Error(`Agent ${instanceId} is not in use`);
    }

    this.inUseAgents.delete(instanceId);
    
    // 重置 Agent 状态
    // 实际实现需要重置上下文等
    
    agent.lastUsedAt = new Date();
    this.availableAgents.push(agent);
  }

  /**
   * 销毁 Agent
   */
  async destroy(instanceId: string): Promise<void> {
    this.inUseAgents.delete(instanceId);
    
    const index = this.availableAgents.findIndex(
      (agent) => agent.instanceId === instanceId
    );
    if (index >= 0) {
      this.availableAgents.splice(index, 1);
    }

    await this.agentManager.terminateAgent(instanceId);
  }

  /**
   * 获取池状态
   */
  getStats(): {
    available: number;
    inUse: number;
    total: number;
  } {
    return {
      available: this.availableAgents.length,
      inUse: this.inUseAgents.size,
      total: this.availableAgents.length + this.inUseAgents.size,
    };
  }

  /**
   * 启动清理定时器
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // 每分钟清理一次
  }

  /**
   * 清理空闲 Agent
   */
  private async cleanup(): Promise<void> {
    const now = Date.now();
    const toRemove: PooledAgent[] = [];

    // 找出超时的 Agent
    for (const agent of this.availableAgents) {
      const idleTime = now - agent.lastUsedAt.getTime();
      if (idleTime > this.config.idleTimeoutMs) {
        toRemove.push(agent);
      }
    }

    // 确保保留最小数量
    const remaining = this.availableAgents.length - toRemove.length;
    if (remaining < this.config.minSize) {
      toRemove.splice(0, this.config.minSize - remaining);
    }

    // 移除超时的 Agent
    for (const agent of toRemove) {
      const index = this.availableAgents.indexOf(agent);
      if (index >= 0) {
        this.availableAgents.splice(index, 1);
      }
      await this.agentManager.terminateAgent(agent.instanceId);
    }

    if (toRemove.length > 0) {
      console.log(`[AgentPool] Cleaned up ${toRemove.length} idle agents`);
    }
  }

  /**
   * 停止池
   */
  async stop(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // 终止所有 Agent
    const allAgents = [
      ...this.availableAgents,
      ...Array.from(this.inUseAgents.values()),
    ];

    await Promise.all(
      allAgents.map((agent) =>
        this.agentManager.terminateAgent(agent.instanceId)
      )
    );

    this.availableAgents = [];
    this.inUseAgents.clear();
  }
}
