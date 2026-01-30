export const apiRoutes = [
  {
    method: "GET",
    path: "/api/agents",
    description: "获取所有 Agent 定义",
    response: "AgentDefinition[]",
  },
  {
    method: "POST",
    path: "/api/agents",
    description: "创建新的 Agent 定义",
    body: "AgentConfig",
    response: "AgentDefinition",
  },
  {
    method: "GET",
    path: "/api/workflows",
    description: "获取所有工作流定义",
    response: "WorkflowDefinition[]",
  },
  {
    method: "POST",
    path: "/api/workflows",
    description: "创建新的工作流定义",
    body: "WorkflowConfig",
    response: "WorkflowDefinition",
  },
];
