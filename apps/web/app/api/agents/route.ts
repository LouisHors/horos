import { NextRequest } from "next/server";
import { db } from "@ai-agent/core/src/db";
import { agentDefinitions } from "@ai-agent/core/src/db/schema";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const agents = await db.select().from(agentDefinitions);
    return successResponse(agents);
  } catch (error) {
    return errorResponse("Failed to fetch agents", 500, error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const [agent] = await db
      .insert(agentDefinitions)
      .values(body)
      .returning();
    return successResponse(agent, 201);
  } catch (error) {
    return errorResponse("Failed to create agent", 500, error);
  }
}
