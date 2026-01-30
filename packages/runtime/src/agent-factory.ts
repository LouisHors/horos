import { db } from "@ai-agent/core/src/db";
import { agentDefinitions, agentInstances } from "@ai-agent/core/src/db/schema";
import { eq } from "drizzle-orm";
import { AgentManager } from "./agent-manager";

interface CreateAgentOptions {
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
  tools?: string[];
  mcpServers?: string[];
  workspaceId: string;
  createdBy: string;
  parentId?: string;
}

export class AgentFactory {
  private agentManager: AgentManager;

  constructor(agentManager: AgentManager) {
    this.agentManager = agentManager;
  }

  /**
   * 创建新的 Agent 定义并启动实例
   */
  async createAgent(options: CreateAgentOptions): Promise<string> {
    // 1. 创建 Agent 定义
    const [definition] = await db
      .insert(agentDefinitions)
      .values({
        workspaceId: options.workspaceId,
        name: options.name,
        role: options.role,
        description: options.description,
        parentId: options.parentId,
        llmConfig: options.llmConfig,
        tools: options.tools || [],
        mcpServers: options.mcpServers,
        createdBy: options.createdBy,
      })
      .returning();

    // 2. 启动 Agent 实例
    const instanceId = await this.agentManager.createAndStartAgent(
      definition.id,
      {
        llmConfig: options.llmConfig,
        tools: options.tools || [],
      }
    );

    console.log(`[AgentFactory] Created agent ${definition.name} (${instanceId})`);

    return instanceId;
  }

  /**
   * 创建子 Agent
   */
  async createChildAgent(
    parentInstanceId: string,
    options: Omit<CreateAgentOptions, "workspaceId" | "createdBy" | "parentId">
  ): Promise<string> {
    // 获取父 Agent 信息
    const parentInstance = await db.query.agentInstances.findFirst({
      where: eq(agentInstances.id, parentInstanceId),
      with: {
        definition: true,
      },
    });

    if (!parentInstance) {
      throw new Error(`Parent agent not found: ${parentInstanceId}`);
    }

    // 创建子 Agent
    const childInstanceId = await this.createAgent({
      ...options,
      workspaceId: parentInstance.workspaceId,
      createdBy: parentInstance.definition.createdBy,
      parentId: parentInstance.definitionId,
    });

    console.log(`[AgentFactory] Created child agent ${childInstanceId} from parent ${parentInstanceId}`);

    return childInstanceId;
  }

  /**
   * 从定义克隆 Agent
   */
  async cloneAgent(
    sourceDefinitionId: string,
    overrides?: Partial<CreateAgentOptions>
  ): Promise<string> {
    const source = await db.query.agentDefinitions.findFirst({
      where: eq(agentDefinitions.id, sourceDefinitionId),
    });

    if (!source) {
      throw new Error(`Source agent definition not found: ${sourceDefinitionId}`);
    }

    const instanceId = await this.createAgent({
      name: overrides?.name || `${source.name} (Clone)`,
      role: overrides?.role || source.role,
      description: overrides?.description || source.description || undefined,
      llmConfig: overrides?.llmConfig || (source.llmConfig as any),
      tools: overrides?.tools || (source.tools as string[]) || [],
      mcpServers: overrides?.mcpServers || (source.mcpServers as string[]) || undefined,
      workspaceId: overrides?.workspaceId || source.workspaceId,
      createdBy: overrides?.createdBy || source.createdBy,
    });

    console.log(`[AgentFactory] Cloned agent ${sourceDefinitionId} to ${instanceId}`);

    return instanceId;
  }
}
