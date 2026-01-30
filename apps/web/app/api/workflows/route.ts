import { NextRequest } from "next/server";
import { db } from "@ai-agent/core/src/db";
import { workflowDefinitions } from "@ai-agent/core/src/db/schema";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const workflows = await db.select().from(workflowDefinitions);
    return successResponse(workflows);
  } catch (error) {
    return errorResponse("Failed to fetch workflows", 500, error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const [workflow] = await db
      .insert(workflowDefinitions)
      .values(body)
      .returning();
    return successResponse(workflow, 201);
  } catch (error) {
    return errorResponse("Failed to create workflow", 500, error);
  }
}
