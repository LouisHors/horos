import { describe, it, expect } from 'vitest';
import { useNodeRegistry } from './useNodeRegistry';
import { NodeType } from '../types';

// Simple mock for React hooks testing without renderHook
describe('useNodeRegistry', () => {
  it('should have correct structure', () => {
    // Verify the hook exports what we expect
    expect(typeof useNodeRegistry).toBe('function');
  });

  it('should have all node types defined', () => {
    expect(NodeType.START).toBe('start');
    expect(NodeType.END).toBe('end');
    expect(NodeType.AGENT).toBe('agent');
    expect(NodeType.TOOL).toBe('tool');
    expect(NodeType.CONDITION).toBe('condition');
  });
});
