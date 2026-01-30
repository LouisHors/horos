import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { WebSocketClientTransport } from "@modelcontextprotocol/sdk/client/websocket.js";

interface MCPServerConfig {
  name: string;
  transport: "stdio" | "websocket";
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
}

interface MCPConnection {
  client: Client;
  transport: StdioClientTransport | WebSocketClientTransport;
  tools: any[];
}

/**
 * MCP Client 管理器
 * 
 * 负责连接和管理多个 MCP 服务器
 */
export class MCPClientManager {
  private connections: Map<string, MCPConnection> = new Map();

  /**
   * 连接到 MCP 服务器
   */
  async connect(serverId: string, config: MCPServerConfig): Promise<void> {
    if (this.connections.has(serverId)) {
      console.log(`[MCPClient] Already connected to ${serverId}`);
      return;
    }

    let transport: StdioClientTransport | WebSocketClientTransport;

    if (config.transport === "stdio") {
      if (!config.command) {
        throw new Error(`Command is required for stdio transport`);
      }
      transport = new StdioClientTransport({
        command: config.command,
        args: config.args || [],
        env: config.env,
      });
    } else {
      if (!config.url) {
        throw new Error(`URL is required for websocket transport`);
      }
      transport = new WebSocketClientTransport(new URL(config.url));
    }

    const client = new Client(
      {
        name: "ai-agent-runtime",
        version: "1.0.0",
      },
      {
        capabilities: {
          prompts: {},
          resources: {},
          tools: {},
        },
      }
    );

    await client.connect(transport);

    // 获取可用工具
    const toolsResult = await client.listTools();

    const connection: MCPConnection = {
      client,
      transport,
      tools: toolsResult.tools || [],
    };

    this.connections.set(serverId, connection);

    console.log(
      `[MCPClient] Connected to ${serverId} with ${connection.tools.length} tools`
    );
  }

  /**
   * 断开与 MCP 服务器的连接
   */
  async disconnect(serverId: string): Promise<void> {
    const connection = this.connections.get(serverId);
    if (!connection) {
      return;
    }

    await connection.client.close();
    this.connections.delete(serverId);

    console.log(`[MCPClient] Disconnected from ${serverId}`);
  }

  /**
   * 调用 MCP 工具
   */
  async callTool(
    serverId: string,
    toolName: string,
    args: any
  ): Promise<any> {
    const connection = this.connections.get(serverId);
    if (!connection) {
      throw new Error(`Not connected to MCP server: ${serverId}`);
    }

    const result = await connection.client.callTool({
      name: toolName,
      arguments: args,
    });

    return result;
  }

  /**
   * 获取所有可用工具
   */
  getAllTools(): Array<{ serverId: string; tool: any }> {
    const tools: Array<{ serverId: string; tool: any }> = [];

    for (const [serverId, connection] of this.connections) {
      for (const tool of connection.tools) {
        tools.push({ serverId, tool });
      }
    }

    return tools;
  }

  /**
   * 获取特定服务器的工具
   */
  getTools(serverId: string): any[] {
    const connection = this.connections.get(serverId);
    return connection?.tools || [];
  }

  /**
   * 断开所有连接
   */
  async disconnectAll(): Promise<void> {
    const ids = Array.from(this.connections.keys());
    await Promise.all(ids.map((id) => this.disconnect(id)));
  }
}
