import { describe, it, expect } from 'vitest';
import { ExecutionEngine } from './ExecutionEngine';
import { WorkflowNode, WorkflowEdge, NodeType } from '@horos/editor';

describe('ExecutionEngine', () => {
  const engine = new ExecutionEngine();
  
  const mockNodes: WorkflowNode[] = [
    { id: 'start', type: NodeType.START, position: { x: 0, y: 0 }, data: {} },
    { id: 'end', type: NodeType.END, position: { x: 100, y: 0 }, data: {} },
  ];
  
  const mockEdges: WorkflowEdge[] = [
    { id: 'e1', source: 'start', target: 'end', type: 'custom' },
  ];
  
  it('should start execution', async () => {
    const execution = await engine.start(mockNodes, mockEdges);
    
    expect(execution.executionId).toBeDefined();
    expect(execution.status).toBe('running');
  });
  
  it('should get execution state', async () => {
    const execution = await engine.start(mockNodes, mockEdges);
    const state = engine.getState(execution.executionId);
    
    expect(state).toBeDefined();
    expect(state?.executionId).toBe(execution.executionId);
  });
});
