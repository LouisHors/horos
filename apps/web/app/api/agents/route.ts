import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";

// 模拟数据
const mockAgents = [
  {
    id: "550e8400-e29b-41d4-a716-446655440000",
    workspaceId: "550e8400-e29b-41d4-a716-446655440001",
    name: "研究助手",
    role: "researcher",
    description: "擅长信息收集和分析的 AI Agent",
    llmConfig: {
      provider: "openai",
      model: "gpt-4",
      temperature: 0.7,
      maxTokens: 2000,
      systemPrompt: "你是一个研究助手..."
    },
    tools: ["web_search", "document_reader"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "550e8400-e29b-41d4-a716-446655440002",
  }
];

export async function GET() {
  try {
    return successResponse(mockAgents);
  } catch (error) {
    return errorResponse("Failed to fetch agents", 500, error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newAgent = {
      id: "550e8400-e29b-41d4-a716-44665544" + Math.floor(Math.random() * 1000),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return successResponse(newAgent, 201);
  } catch (error) {
    return errorResponse("Failed to create agent", 500, error);
  }
}
