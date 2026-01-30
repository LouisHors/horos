import { Tool, ToolExecutor } from "./tool-executor";
import { MCPClientManager } from "./mcp-client";

interface RegisteredTool extends Tool {
  source: "local" | "mcp";
  serverId?: string;
}

/**
 * 工具注册表
 * 
 * 管理本地工具和 MCP 工具的注册与发现
 */
export class ToolRegistry {
  private tools: Map<string, RegisteredTool> = new Map();
  private mcpManager: MCPClientManager;
  private toolExecutor: ToolExecutor;

  constructor(mcpManager: MCPClientManager) {
    this.mcpManager = mcpManager;
    this.toolExecutor = new ToolExecutor();
  }

  /**
   * 注册本地工具
   */
  registerLocalTool(tool: Tool): void {
    const registeredTool: RegisteredTool = {
      ...tool,
      source: "local",
    };

    this.tools.set(tool.name, registeredTool);
    this.toolExecutor.registerTool(tool);

    console.log(`[ToolRegistry] Registered local tool: ${tool.name}`);
  }

  /**
   * 从 MCP 服务器同步工具
   */
  async syncMCPTools(serverId: string): Promise<void> {
    const tools = this.mcpManager.getTools(serverId);

    for (const tool of tools) {
      const registeredTool: RegisteredTool = {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
        source: "mcp",
        serverId,
        execute: async (args: any) => {
          const result = await this.mcpManager.callTool(
            serverId,
            tool.name,
            args
          );
          return result;
        },
      };

      this.tools.set(tool.name, registeredTool);
      this.toolExecutor.registerTool(registeredTool);

      console.log(`[ToolRegistry] Registered MCP tool: ${tool.name} from ${serverId}`);
    }
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
   * 获取工具执行器
   */
  getToolExecutor(): ToolExecutor {
    return this.toolExecutor;
  }

  /**
   * 获取工具信息
   */
  getTool(name: string): RegisteredTool | undefined {
    return this.tools.get(name);
  }

  /**
   * 获取所有工具
   */
  getAllTools(): RegisteredTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * 检查工具是否存在
   */
  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * 卸载 MCP 服务器的工具
   */
  async unloadMCPTools(serverId: string): Promise<void> {
    for (const [name, tool] of this.tools) {
      if (tool.source === "mcp" && tool.serverId === serverId) {
        this.tools.delete(name);
        console.log(`[ToolRegistry] Unloaded MCP tool: ${name}`);
      }
    }
  }

  /**
   * 注册默认工具
   */
  registerDefaultTools(): void {
    // 等待工具
    this.registerLocalTool({
      name: "wait",
      description: "等待指定的时间",
      parameters: {
        type: "object",
        properties: {
          seconds: {
            type: "number",
            description: "等待的秒数",
          },
        },
        required: ["seconds"],
      },
      execute: async (args: { seconds: number }) => {
        await new Promise((resolve) => setTimeout(resolve, args.seconds * 1000));
        return { success: true, waited: args.seconds };
      },
    });

    // 获取当前时间工具
    this.registerLocalTool({
      name: "get_current_time",
      description: "获取当前时间",
      parameters: {
        type: "object",
        properties: {
          timezone: {
            type: "string",
            description: "时区，如 'Asia/Shanghai'",
          },
        },
      },
      execute: async (args: { timezone?: string }) => {
        const now = new Date();
        return {
          timestamp: now.toISOString(),
          timezone: args.timezone || "UTC",
        };
      },
    });

    console.log("[ToolRegistry] Registered default tools");
  }
}
