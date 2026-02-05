import { describe, it, expect } from 'vitest';
import {
  ExecutionStatus,
  NodeExecutionStatus,
  HistoryEntry,
  ClipboardData,
  FlowDefinition,
} from './flow';

describe('Flow Types', () => {
  describe('ExecutionStatus Enum', () => {
    it('should have all execution statuses', () => {
      expect(ExecutionStatus.IDLE).toBe('idle');
      expect(ExecutionStatus.RUNNING).toBe('running');
      expect(ExecutionStatus.PAUSED).toBe('paused');
      expect(ExecutionStatus.COMPLETED).toBe('completed');
      expect(ExecutionStatus.FAILED).toBe('failed');
      expect(ExecutionStatus.CANCELLED).toBe('cancelled');
    });

    it('should have 6 execution statuses', () => {
      expect(Object.values(ExecutionStatus)).toHaveLength(6);
    });
  });

  describe('NodeExecutionStatus Enum', () => {
    it('should have all node execution statuses', () => {
      expect(NodeExecutionStatus.PENDING).toBe('pending');
      expect(NodeExecutionStatus.RUNNING).toBe('running');
      expect(NodeExecutionStatus.SUCCESS).toBe('success');
      expect(NodeExecutionStatus.ERROR).toBe('error');
      expect(NodeExecutionStatus.SKIPPED).toBe('skipped');
    });

    it('should have 5 node execution statuses', () => {
      expect(Object.values(NodeExecutionStatus)).toHaveLength(5);
    });
  });

  describe('HistoryEntry', () => {
    it('should create valid history entry', () => {
      const entry: HistoryEntry = {
        id: 'hist-1',
        timestamp: Date.now(),
        type: 'node',
        action: 'add',
        data: { nodeId: 'node-1', type: 'agent' },
      };

      expect(entry.type).toBe('node');
      expect(entry.action).toBe('add');
      expect(entry.timestamp).toBeGreaterThan(0);
    });

    it('should support previousState for undo', () => {
      const entry: HistoryEntry = {
        id: 'hist-2',
        timestamp: Date.now(),
        type: 'property',
        action: 'update',
        data: { nodeId: 'node-1', property: 'label', value: 'New Label' },
        previousState: { label: 'Old Label' },
      };

      expect(entry.previousState).toBeDefined();
      expect(entry.previousState).toEqual({ label: 'Old Label' });
    });
  });

  describe('ClipboardData', () => {
    it('should create valid clipboard data', () => {
      const clipboard: ClipboardData = {
        nodes: [],
        edges: [],
        timestamp: Date.now(),
      };

      expect(clipboard.nodes).toEqual([]);
      expect(clipboard.edges).toEqual([]);
      expect(clipboard.timestamp).toBeGreaterThan(0);
    });
  });

  describe('FlowDefinition', () => {
    it('should create valid flow definition', () => {
      const flow: FlowDefinition = {
        id: 'flow-1',
        name: 'Test Flow',
        description: 'A test workflow',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        canvas: {
          nodes: [],
          edges: [],
          selectedNodes: [],
          selectedEdges: [],
        },
      };

      expect(flow.id).toBe('flow-1');
      expect(flow.name).toBe('Test Flow');
      expect(flow.canvas.nodes).toEqual([]);
    });
  });
});
