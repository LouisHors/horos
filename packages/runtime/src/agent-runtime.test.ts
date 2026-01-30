import { describe, it, expect, beforeEach, vi } from "vitest";
import { AgentRuntime } from "./agent-runtime";
import { AgentStateMachine } from "./agent-state-machine";

describe("AgentRuntime", () => {
  let runtime: AgentRuntime;

  beforeEach(() => {
    runtime = new AgentRuntime({
      agentId: "test-agent-1",
      llmConfig: {
        provider: "openai",
        model: "gpt-4",
        temperature: 0.7,
        maxTokens: 2000,
        systemPrompt: "You are a helpful assistant.",
      },
      tools: [],
    });
  });

  it("should create runtime with correct config", () => {
    expect(runtime).toBeDefined();
    expect(runtime.getStatus()).toBe("idle");
  });

  it("should change status when paused", () => {
    runtime.pause();
    expect(runtime.getStatus()).toBe("paused");
  });

  it("should change status when resumed", () => {
    runtime.pause();
    runtime.resume();
    expect(runtime.getStatus()).toBe("running");
  });

  it("should change status when terminated", () => {
    runtime.terminate();
    expect(runtime.getStatus()).toBe("terminated");
  });
});

describe("AgentStateMachine", () => {
  let sm: AgentStateMachine;

  beforeEach(() => {
    sm = new AgentStateMachine();
  });

  it("should start in idle state", () => {
    expect(sm.getState()).toBe("idle");
  });

  it("should transition from idle to running", async () => {
    await sm.start();
    expect(sm.getState()).toBe("running");
  });

  it("should transition from running to paused", async () => {
    await sm.start();
    await sm.pause();
    expect(sm.getState()).toBe("paused");
  });

  it("should transition from paused to running", async () => {
    await sm.start();
    await sm.pause();
    await sm.resume();
    expect(sm.getState()).toBe("running");
  });

  it("should transition from running to terminated", async () => {
    await sm.start();
    await sm.terminate();
    expect(sm.getState()).toBe("terminated");
  });

  it("should not allow invalid transitions", async () => {
    await expect(sm.pause()).rejects.toThrow();
  });

  it("should correctly check if running", async () => {
    expect(sm.isRunning()).toBe(false);
    await sm.start();
    expect(sm.isRunning()).toBe(true);
  });

  it("should correctly check if terminated", async () => {
    expect(sm.isTerminated()).toBe(false);
    await sm.terminate();
    expect(sm.isTerminated()).toBe(true);
  });
});

describe("ContextManager", () => {
  it("should be created with agent ID", async () => {
    const { ContextManager } = await import("./context-manager");
    const cm = new ContextManager("test-agent");
    expect(cm).toBeDefined();
  });

  it("should add messages to context", async () => {
    const { ContextManager } = await import("./context-manager");
    const cm = new ContextManager("test-agent");
    
    cm.addMessage({
      role: "user",
      content: "Hello",
    });

    const context = cm.getContext();
    expect(context).toHaveLength(1);
    expect(context[0].content).toBe("Hello");
  });

  it("should set system prompt", async () => {
    const { ContextManager } = await import("./context-manager");
    const cm = new ContextManager("test-agent");
    
    cm.setSystemPrompt("You are a helpful assistant.");

    const context = cm.getContext();
    expect(context[0].role).toBe("system");
    expect(context[0].content).toBe("You are a helpful assistant.");
  });

  it("should clear context", async () => {
    const { ContextManager } = await import("./context-manager");
    const cm = new ContextManager("test-agent");
    
    cm.addMessage({ role: "user", content: "Hello" });
    cm.clear();

    expect(cm.getContext()).toHaveLength(0);
  });
});

describe("ToolExecutor", () => {
  it("should register tools", async () => {
    const { ToolExecutor } = await import("./tool-executor");
    const executor = new ToolExecutor();

    executor.registerTool({
      name: "test_tool",
      description: "A test tool",
      parameters: { type: "object", properties: {} },
      execute: async () => "result",
    });

    const definitions = executor.getToolDefinitions();
    expect(definitions).toHaveLength(1);
    expect(definitions[0].function.name).toBe("test_tool");
  });

  it("should execute tools", async () => {
    const { ToolExecutor } = await import("./tool-executor");
    const executor = new ToolExecutor();

    executor.registerTool({
      name: "echo",
      description: "Echo tool",
      parameters: { type: "object", properties: {} },
      execute: async (args: any) => args.message,
    });

    const result = await executor.executeTool("echo", { message: "hello" });
    expect(result).toBe("hello");
  });

  it("should throw for unknown tools", async () => {
    const { ToolExecutor } = await import("./tool-executor");
    const executor = new ToolExecutor();

    await expect(executor.executeTool("unknown", {})).rejects.toThrow(
      "Tool not found"
    );
  });
});
