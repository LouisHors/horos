import { describe, it, expect, beforeEach } from 'vitest';
import { HistoryManager } from './HistoryManager';
import { WorkflowNode, WorkflowEdge, NodeType } from '../types';

describe('HistoryManager', () => {
  let manager: HistoryManager;
  
  const mockNode: WorkflowNode = {
    id: 'node-1',
    type: NodeType.AGENT,
    position: { x: 100, y: 100 },
    data: { label: 'Test Node' },
  };
  
  const mockEdge: WorkflowEdge = {
    id: 'edge-1',
    source: 'node-1',
    target: 'node-2',
    type: 'custom',
  };
  
  beforeEach(() => {
    manager = new HistoryManager({ maxHistory: 10 });
  });
  
  describe('基本操作', () => {
    it('should start with empty history', () => {
      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(false);
      expect(manager.getHistoryLength()).toBe(0);
      expect(manager.getCurrentIndex()).toBe(-1);
    });
    
    it('should record an entry', () => {
      manager.record({
        type: 'ADD_NODE',
        description: 'Add node',
        previousState: { nodes: [], edges: [] },
        nextState: { nodes: [mockNode], edges: [] },
        affectedIds: ['node-1'],
      });
      
      expect(manager.getHistoryLength()).toBe(1);
      expect(manager.getCurrentIndex()).toBe(0);
      expect(manager.canUndo()).toBe(true);
    });
    
    it('should undo an operation', () => {
      const prevNodes: WorkflowNode[] = [];
      const nextNodes: WorkflowNode[] = [mockNode];
      
      manager.record({
        type: 'ADD_NODE',
        description: 'Add node',
        previousState: { nodes: prevNodes, edges: [] },
        nextState: { nodes: nextNodes, edges: [] },
        affectedIds: ['node-1'],
      });
      
      const result = manager.undo();
      expect(result).toBeDefined();
      expect(result?.nodes).toEqual(prevNodes);
      expect(manager.getCurrentIndex()).toBe(-1);
    });
    
    it('should redo an operation', () => {
      const prevNodes: WorkflowNode[] = [];
      const nextNodes: WorkflowNode[] = [mockNode];
      
      manager.record({
        type: 'ADD_NODE',
        description: 'Add node',
        previousState: { nodes: prevNodes, edges: [] },
        nextState: { nodes: nextNodes, edges: [] },
        affectedIds: ['node-1'],
      });
      
      manager.undo();
      const result = manager.redo();
      
      expect(result).toBeDefined();
      expect(result?.nodes).toEqual(nextNodes);
      expect(manager.getCurrentIndex()).toBe(0);
    });
    
    it('should return null when undo with empty history', () => {
      const result = manager.undo();
      expect(result).toBeNull();
    });
    
    it('should return null when redo at end of history', () => {
      manager.record({
        type: 'ADD_NODE',
        description: 'Add node',
        previousState: { nodes: [], edges: [] },
        nextState: { nodes: [mockNode], edges: [] },
        affectedIds: ['node-1'],
      });
      
      const result = manager.redo();
      expect(result).toBeNull();
    });
  });
  
  describe('便捷方法', () => {
    it('should record add node', () => {
      const currentNodes: WorkflowNode[] = [];
      const currentEdges: WorkflowEdge[] = [];
      
      manager.recordAddNode(mockNode, currentNodes, currentEdges);
      
      expect(manager.getHistoryLength()).toBe(1);
      expect(manager.canUndo()).toBe(true);
      
      const undone = manager.undo();
      expect(undone?.nodes).toHaveLength(0);
    });
    
    it('should record remove node with edges', () => {
      const currentNodes: WorkflowNode[] = [mockNode];
      const currentEdges: WorkflowEdge[] = [mockEdge];
      
      manager.recordRemoveNode(mockNode, [mockEdge], currentNodes, currentEdges);
      
      const undone = manager.undo();
      expect(undone?.nodes).toHaveLength(1);
      expect(undone?.edges).toHaveLength(1);
    });
    
    it('should record update node', () => {
      const currentNodes: WorkflowNode[] = [mockNode];
      const currentEdges: WorkflowEdge[] = [];
      
      manager.recordUpdateNode(
        'node-1',
        { label: 'Old Label' },
        { label: 'New Label' },
        currentNodes,
        currentEdges
      );
      
      expect(manager.getHistoryLength()).toBe(1);
    });
    
    it('should record add edge', () => {
      const currentNodes: WorkflowNode[] = [mockNode];
      const currentEdges: WorkflowEdge[] = [];
      
      manager.recordAddEdge(mockEdge, currentNodes, currentEdges);
      
      expect(manager.getHistoryLength()).toBe(1);
    });
    
    it('should record remove edge', () => {
      const currentNodes: WorkflowNode[] = [mockNode];
      const currentEdges: WorkflowEdge[] = [mockEdge];
      
      manager.recordRemoveEdge(mockEdge, currentNodes, currentEdges);
      
      expect(manager.getHistoryLength()).toBe(1);
    });
  });
  
  describe('历史限制', () => {
    it('should respect max history limit', () => {
      const limitedManager = new HistoryManager({ maxHistory: 3 });
      
      for (let i = 0; i < 5; i++) {
        limitedManager.record({
          type: 'ADD_NODE',
          description: `Add node ${i}`,
          previousState: { nodes: [], edges: [] },
          nextState: { nodes: [mockNode], edges: [] },
          affectedIds: [`node-${i}`],
        });
      }
      
      expect(limitedManager.getHistoryLength()).toBe(3);
    });
  });
  
  describe('分支处理', () => {
    it('should truncate future history when recording in middle', () => {
      // Record 3 operations
      for (let i = 0; i < 3; i++) {
        manager.record({
          type: 'ADD_NODE',
          description: `Add node ${i}`,
          previousState: { nodes: [], edges: [] },
          nextState: { nodes: [mockNode], edges: [] },
          affectedIds: [`node-${i}`],
        });
      }
      
      // Undo twice
      manager.undo();
      manager.undo();
      
      expect(manager.getCurrentIndex()).toBe(0);
      
      // Record new operation - should truncate history
      manager.record({
        type: 'ADD_NODE',
        description: 'New node after undo',
        previousState: { nodes: [], edges: [] },
        nextState: { nodes: [mockNode], edges: [] },
        affectedIds: ['new-node'],
      });
      
      expect(manager.getHistoryLength()).toBe(2);
      expect(manager.getCurrentIndex()).toBe(1);
      expect(manager.canRedo()).toBe(false);
    });
  });
  
  describe('跳转', () => {
    it('should jump to specific index', () => {
      for (let i = 0; i < 3; i++) {
        manager.record({
          type: 'ADD_NODE',
          description: `Add node ${i}`,
          previousState: { nodes: [], edges: [] },
          nextState: { nodes: [mockNode], edges: [] },
          affectedIds: [`node-${i}`],
        });
      }
      
      const result = manager.jumpTo(0);
      expect(result).toBeDefined();
      expect(manager.getCurrentIndex()).toBe(0);
    });
    
    it('should return null for invalid index', () => {
      expect(manager.jumpTo(-2)).toBeNull();
      expect(manager.jumpTo(100)).toBeNull();
    });
  });
  
  describe('清除', () => {
    it('should clear history', () => {
      manager.record({
        type: 'ADD_NODE',
        description: 'Add node',
        previousState: { nodes: [], edges: [] },
        nextState: { nodes: [mockNode], edges: [] },
        affectedIds: ['node-1'],
      });
      
      manager.clear();
      
      expect(manager.getHistoryLength()).toBe(0);
      expect(manager.getCurrentIndex()).toBe(-1);
      expect(manager.canUndo()).toBe(false);
    });
  });
});
