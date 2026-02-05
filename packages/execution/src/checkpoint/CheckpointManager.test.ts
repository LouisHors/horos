import { describe, it, expect } from 'vitest';
import { CheckpointManager } from './CheckpointManager';
import { ExecutionState } from '../types';

describe('CheckpointManager', () => {
  const manager = new CheckpointManager();
  
  const mockState: ExecutionState = {
    executionId: 'test-001',
    status: 'running',
    currentNodes: ['node-1'],
    completedNodes: ['start'],
    failedNodes: [],
    pendingNodes: ['node-2'],
    context: {
      executionId: 'test-001',
      workflowId: 'wf-001',
      variables: new Map(),
      nodeOutputs: new Map([['start', { result: 'ok' }]]),
      startTime: new Date(),
    },
  };
  
  it('should create checkpoint', async () => {
    const checkpoint = await manager.create(mockState);
    
    expect(checkpoint).toBeDefined();
    expect(checkpoint.executionId).toBe('test-001');
  });
  
  it('should restore from checkpoint', async () => {
    const checkpoint = await manager.create(mockState);
    const restored = await manager.restore(checkpoint.id);
    
    expect(restored).toBeDefined();
    expect(restored?.executionId).toBe('test-001');
  });
  
  it('should return null for non-existent checkpoint', async () => {
    const restored = await manager.restore('non-existent');
    expect(restored).toBeNull();
  });
});
