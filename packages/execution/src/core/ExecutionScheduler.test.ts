import { describe, it, expect } from 'vitest';
import { ExecutionScheduler } from './ExecutionScheduler';
import { WorkflowDAG } from '../types';

describe('ExecutionScheduler', () => {
  const scheduler = new ExecutionScheduler();
  
  const mockDAG: WorkflowDAG = {
    id: 'test-dag',
    nodes: new Map([
      ['a', { id: 'a', node: {} as any, dependencies: [], dependents: ['b', 'c'], level: 0 }],
      ['b', { id: 'b', node: {} as any, dependencies: ['a'], dependents: ['d'], level: 1 }],
      ['c', { id: 'c', node: {} as any, dependencies: ['a'], dependents: ['d'], level: 1 }],
      ['d', { id: 'd', node: {} as any, dependencies: ['b', 'c'], dependents: [], level: 2 }],
    ]),
    edges: [],
    startNodes: ['a'],
    endNodes: ['d'],
    levels: [['a'], ['b', 'c'], ['d']],
  };
  
  it('should return ready nodes', () => {
    const completed = new Set<string>();
    const ready = scheduler.getReadyNodes(mockDAG, completed);
    
    expect(ready).toContain('a');
    expect(ready).toHaveLength(1);
  });
  
  it('should return next level after completion', () => {
    const completed = new Set(['a']);
    const ready = scheduler.getReadyNodes(mockDAG, completed);
    
    expect(ready).toContain('b');
    expect(ready).toContain('c');
    expect(ready).toHaveLength(2);
  });
});
