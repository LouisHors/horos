import { describe, it, expect } from 'vitest';
import { NodeExecutor } from './NodeExecutor';
import { WorkflowNode, NodeType } from '@horos/editor';

describe('NodeExecutor', () => {
  const executor = new NodeExecutor();
  
  it('should execute start node', async () => {
    const node: WorkflowNode = {
      id: 'start',
      type: NodeType.START,
      position: { x: 0, y: 0 },
      data: { initialContext: { user: 'test' } },
    };
    
    const result = await executor.execute(node, {});
    
    expect(result.status).toBe('success');
    expect(result.output).toEqual({ user: 'test' });
  });
  
  it('should execute end node', async () => {
    const node: WorkflowNode = {
      id: 'end',
      type: NodeType.END,
      position: { x: 0, y: 0 },
      data: {},
    };
    
    const result = await executor.execute(node, {});
    
    expect(result.status).toBe('success');
    expect(result.output).toEqual({ completed: true });
  });
});
