import { describe, it, expect } from 'vitest';
import { ExecutionScheduler } from './ExecutionScheduler';
import { DAG } from '../types';

describe('ExecutionScheduler', () => {
  const mockDAG: DAG = {
    nodes: [
      { id: 'a', type: 'start', data: {}, inputs: [], outputs: ['b', 'c'] },
      { id: 'b', type: 'agent', data: {}, inputs: ['a'], outputs: ['d'] },
      { id: 'c', type: 'agent', data: {}, inputs: ['a'], outputs: ['d'] },
      { id: 'd', type: 'end', data: {}, inputs: ['b', 'c'], outputs: [] },
    ],
    edges: [
      { id: 'e1', source: 'a', target: 'b' },
      { id: 'e2', source: 'a', target: 'c' },
      { id: 'e3', source: 'b', target: 'd' },
      { id: 'e4', source: 'c', target: 'd' },
    ],
    executionOrder: [['a'], ['b', 'c'], ['d']],
  };

  it('should return ready nodes', () => {
    const scheduler = new ExecutionScheduler({ maxParallelism: 2 });
    scheduler.initialize(mockDAG);
    
    const ready = scheduler.getReadyNodes();
    
    expect(ready).toContain('a');
  });

  it('should return next level after completion', () => {
    const scheduler = new ExecutionScheduler({ maxParallelism: 2 });
    scheduler.initialize(mockDAG);
    
    scheduler.completeNode('a');
    const ready = scheduler.getReadyNodes();
    
    expect(ready).toContain('b');
    expect(ready).toContain('c');
  });

  it('should handle parallel execution', async () => {
    const scheduler = new ExecutionScheduler({ maxParallelism: 2, enableParallel: true });
    const executed: string[] = [];
    
    const mockEngine = {
      executeNode: async (id: string) => {
        executed.push(id);
        return { result: id };
      },
    };
    
    await scheduler.scheduleExecution(
      mockDAG,
      mockEngine as any,
      { executionId: 'test', workflowId: 'wf', variables: new Map(), nodeOutputs: new Map(), startTime: new Date() }
    );
    
    expect(executed).toContain('a');
    expect(executed).toContain('b');
    expect(executed).toContain('c');
    expect(executed).toContain('d');
  });
});
