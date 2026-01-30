import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";

// 模拟数据
const mockWorkflows = [
  {
    id: "550e8400-e29b-41d4-a716-446655440010",
    workspaceId: "550e8400-e29b-41d4-a716-446655440001",
    name: "研究任务工作流",
    description: "自动化研究任务执行流程",
    nodes: [
      { id: "node-1", type: "agent", position: { x: 100, y: 100 }, data: { label: "研究助手", agentId: "550e8400-e29b-41d4-a716-446655440000" } },
      { id: "node-2", type: "tool", position: { x: 300, y: 100 }, data: { label: "搜索结果汇总", toolId: "summarize" } }
    ],
    edges: [
      { id: "edge-1", source: "node-1", target: "node-2" }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "550e8400-e29b-41d4-a716-446655440002",
  }
];

export async function GET() {
  try {
    return successResponse(mockWorkflows);
  } catch (error) {
    return errorResponse("Failed to fetch workflows", 500, error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newWorkflow = {
      id: "550e8400-e29b-41d4-a716-44665544" + Math.floor(Math.random() * 1000),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return successResponse(newWorkflow, 201);
  } catch (error) {
    return errorResponse("Failed to create workflow", 500, error);
  }
}
