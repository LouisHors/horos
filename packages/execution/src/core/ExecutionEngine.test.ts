import { describe, it, expect, vi } from 'vitest';
import { ExecutionEngine } from './ExecutionEngine';
import { NodeExecutor } from '../executors/NodeExecutor';
import { WorkflowNode, WorkflowEdge, NodeType, DAGNode, ExecutionContext } from '../types';

class MockExecutor extends NodeExecutor {
  async execute() {
    return { result: 'mock' };
  }
}

describe('ExecutionEngine', () => {
  const createEngine = () => {
    const engine = new ExecutionEngine();
    engine.registerExecutor(NodeType.AGENT, new MockExecutor());
    engine.registerExecutor(NodeType.TOOL, new MockExecutor());
    engine.registerExecutor(NodeType.START, new MockExecutor());
    return engine;
  };

  const createNode = (id: string, type: string): WorkflowNode => ({
    id,
    type,
    data: {},
    position: { x: 0, y: 0 },
  });

  it('should execute workflow', async () => {
    const engine = createEngine();

    const nodes: WorkflowNode[] = [
      createNode('start', NodeType.START),
      createNode('agent', NodeType.AGENT),
    ];
    const edges: WorkflowEdge[] = [
      { id: 'e1', source: 'start', target: 'agent' },
    ];

    const result = await engine.execute(nodes, edges);

    expect(result.success).toBe(true);
    expect(result.status).toBe('completed');
  });

  it('should report progress', async () => {
    const engine = createEngine();
    const progressFn = vi.fn();

    engine.on('progress', progressFn);

    const nodes: WorkflowNode[] = [
      createNode('start', NodeType.START),
    ];

    await engine.execute(nodes, []);

    expect(progressFn).toHaveBeenCalled();
  });

  it('should pause and resume', () => {
    const engine = createEngine();
    const pauseFn = vi.fn();
    const resumeFn = vi.fn();

    engine.on('pause', pauseFn);
    engine.on('resume', resumeFn);

    // 先执行以初始化状态
    const nodes: WorkflowNode[] = [createNode('start', NodeType.START)];
    engine.execute(nodes, []);

    engine.pause();
    expect(engine.getState()?.status).toBe('paused');

    engine.resume();
    expect(engine.getState()?.status).toBe('running');
  });
});
