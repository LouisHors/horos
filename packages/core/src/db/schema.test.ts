import { describe, it, expect } from "vitest";
import { workspaces, agentDefinitions } from "./schema";

describe("Database Schema", () => {
  it("should have workspaces table defined", () => {
    expect(workspaces).toBeDefined();
    expect(workspaces.name).toBeDefined();
  });

  it("should have agentDefinitions table defined", () => {
    expect(agentDefinitions).toBeDefined();
    expect(agentDefinitions.name).toBeDefined();
  });
});
