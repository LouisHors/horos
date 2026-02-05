import { describe, it, expect, vi } from 'vitest';
import { ExecutionEngine } from './ExecutionEngine';
import { NodeType } from '../types';
import type { WorkflowNode, WorkflowEdge, NodeExecutor, ExecutionContext } from '../types';

class MockExecutor implements NodeExecutor {
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
  
  it('should execute workflow', async () => {
    const engine = createEngine();
    
    const nodes: WorkflowNode[] = [
      { id: 'start', type: NodeType.START, data: {}, position: { x: 0, y: 0 } },
      { id: 'agent', type: NodeType.AGENT, data: {}, position: { x: 100, y: 0 } },
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
      { id: 'start', type: NodeType.START, data: {}, position: { x: 0, y: 0 } },
    ];
    
    await engine.execute(nodes, []);
    
    expect(progressFn).toHaveBeenCalled();
  });
});
