/**
 * Agent Runtime 基本使用示例
 * 
 * 展示如何创建和运行一个简单的 Agent
 */

import {
  AgentManager,
  AgentFactory,
  GroupService,
  MCPClientManager,
  ToolRegistry,
} from "../src";

async function main() {
  console.log("=== AI Agent Runtime Demo ===\n");

  // 1. 初始化组件
  const agentManager = new AgentManager(10);
  const agentFactory = new AgentFactory(agentManager);
  const groupService = new GroupService();
  const mcpManager = new MCPClientManager();
  const toolRegistry = new ToolRegistry(mcpManager);

  // 2. 注册默认工具
  toolRegistry.registerDefaultTools();

  console.log("1. Creating workspace...");
  // 注意：实际使用时需要先创建工作空间
  // const workspaceId = await createWorkspace("Demo Workspace");
  const workspaceId = "demo-workspace-id";

  console.log("2. Creating agents...");
  // 3. 创建第一个 Agent（助手）
  const assistantId = await agentFactory.createAgent({
    name: "研究助手",
    role: "researcher",
    description: "擅长信息收集和分析的 AI Agent",
    llmConfig: {
      provider: "openai",
      model: "gpt-4",
      temperature: 0.7,
      maxTokens: 2000,
      systemPrompt: "你是一个专业的研究助手，擅长分析和总结信息。",
    },
    tools: ["get_current_time", "wait"],
    workspaceId,
    createdBy: "user-1",
  });

  console.log(`   - Created assistant: ${assistantId}`);

  // 4. 创建第二个 Agent（分析员）
  const analystId = await agentFactory.createAgent({
    name: "数据分析师",
    role: "analyst",
    description: "擅长数据分析和可视化",
    llmConfig: {
      provider: "openai",
      model: "gpt-4",
      temperature: 0.5,
      maxTokens: 2000,
      systemPrompt: "你是一个数据分析师，擅长从数据中发现洞察。",
    },
    tools: ["get_current_time"],
    workspaceId,
    createdBy: "user-1",
  });

  console.log(`   - Created analyst: ${analystId}`);

  console.log("\n3. Creating a group...");
  // 5. 创建 Group 让两个 Agent 协作
  const groupId = await groupService.createGroup({
    name: "研究项目组",
    type: "group",
    workspaceId,
    initialMembers: [assistantId, analystId],
  });

  console.log(`   - Created group: ${groupId}`);

  console.log("\n4. Sending initial message...");
  // 6. 发送初始消息触发 Agent 工作
  await groupService.sendMessage({
    groupId,
    senderId: "user-1",
    content: "请帮我分析最近的市场趋势",
    contentType: "text",
  });

  console.log("   - Message sent");

  console.log("\n5. Checking agent status...");
  // 7. 查看 Agent 状态
  const runningAgents = agentManager.getRunningAgents();
  console.log(`   - Running agents: ${runningAgents.length}`);
  for (const agentId of runningAgents) {
    const status = agentManager.getAgentStatus(agentId);
    console.log(`     - ${agentId}: ${status}`);
  }

  console.log("\n6. Creating child agent...");
  // 8. 创建子 Agent（展示父子关系）
  const childId = await agentFactory.createChildAgent(assistantId, {
    name: "专门助手",
    role: "specialist",
    description: "专门处理特定任务的子 Agent",
    llmConfig: {
      provider: "openai",
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      maxTokens: 1500,
      systemPrompt: "你是一个专门处理市场数据的助手。",
    },
    tools: ["get_current_time"],
  });

  console.log(`   - Created child agent: ${childId}`);

  console.log("\n7. Demonstrating MCP integration...");
  // 9. 展示 MCP 工具集成（可选）
  try {
    // 连接到 MCP 服务器（需要实际的服务器配置）
    // await mcpManager.connect("filesystem", {
    //   transport: "stdio",
    //   command: "npx",
    //   args: ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
    // });
    // 
    // await toolRegistry.syncMCPTools("filesystem");
    
    console.log("   - MCP integration ready (disabled in demo)");
  } catch (error) {
    console.log("   - MCP demo skipped (no server available)");
  }

  console.log("\n8. Cleaning up...");
  // 10. 清理
  await agentManager.terminateAll();
  await mcpManager.disconnectAll();

  console.log("\n=== Demo completed ===");
}

// 运行示例
if (require.main === module) {
  main().catch(console.error);
}
