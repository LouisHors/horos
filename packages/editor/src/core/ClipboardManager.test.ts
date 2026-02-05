import { describe, it, expect, beforeEach } from 'vitest';
import { ClipboardManager } from './ClipboardManager';
import { WorkflowNode, WorkflowEdge, NodeType } from '../types';

describe('ClipboardManager', () => {
  let manager: ClipboardManager;
  
  const mockNodes: WorkflowNode[] = [
    {
      id: 'node-1',
      type: NodeType.START,
      position: { x: 100, y: 100 },
      data: { label: 'Start' },
    },
    {
      id: 'node-2',
      type: NodeType.END,
      position: { x: 300, y: 100 },
      data: { label: 'End' },
    },
  ];
  
  const mockEdges: WorkflowEdge[] = [
    {
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2',
      type: 'custom',
    },
  ];
  
  beforeEach(() => {
    manager = new ClipboardManager();
  });
  
  describe('基本操作', () => {
    it('should start empty', () => {
      expect(manager.hasData()).toBe(false);
      expect(manager.getData()).toBeNull();
    });
    
    it('should copy nodes and edges', () => {
      const data = manager.copy(mockNodes, mockEdges, 'workflow-1');
      
      expect(manager.hasData()).toBe(true);
      expect(data.nodes).toHaveLength(2);
      expect(data.edges).toHaveLength(1);
      expect(data.sourceWorkflowId).toBe('workflow-1');
      expect(data.version).toBe('1.0');
    });
    
    it('should paste with new IDs', () => {
      manager.copy(mockNodes, mockEdges);
      const pasted = manager.paste();
      
      expect(pasted).toBeDefined();
      expect(pasted?.nodes).toHaveLength(2);
      expect(pasted?.nodes[0].id).not.toBe('node-1');
      expect(pasted?.nodes[1].id).not.toBe('node-2');
    });
    
    it('should apply offset on multiple pastes', () => {
      manager.copy(mockNodes, mockEdges);
      
      const paste1 = manager.paste({ x: 50, y: 50 });
      const paste2 = manager.paste({ x: 50, y: 50 });
      
      expect(paste1?.nodes[0].position.x).toBe(150);
      expect(paste1?.nodes[0].position.y).toBe(150);
      
      expect(paste2?.nodes[0].position.x).toBe(200);
      expect(paste2?.nodes[0].position.y).toBe(200);
    });
    
    it('should return null when pasting empty clipboard', () => {
      const result = manager.paste();
      expect(result).toBeNull();
    });
    
    it('should clear clipboard', () => {
      manager.copy(mockNodes, mockEdges);
      manager.clear();
      
      expect(manager.hasData()).toBe(false);
    });
  });
  
  describe('序列化', () => {
    it('should serialize to JSON', () => {
      const data = manager.copy(mockNodes, mockEdges);
      const json = manager.serialize(data);
      
      expect(json).toBeDefined();
      expect(typeof json).toBe('string');
      
      const parsed = JSON.parse(json);
      expect(parsed.nodes).toHaveLength(2);
      expect(parsed.edges).toHaveLength(1);
    });
    
    it('should deserialize from JSON', () => {
      const data = manager.copy(mockNodes, mockEdges);
      const json = manager.serialize(data);
      
      manager.clear();
      const result = manager.deserialize(json!);
      
      expect(result).toBeDefined();
      expect(manager.hasData()).toBe(true);
    });
    
    it('should return null for invalid JSON', () => {
      const result = manager.deserialize('invalid json');
      expect(result).toBeNull();
    });
    
    it('should return null for invalid data structure', () => {
      const result = manager.deserialize('{"version": "1.0"}');
      expect(result).toBeNull();
    });
  });
  
  describe('边处理', () => {
    it('should update edge source and target IDs on paste', () => {
      manager.copy(mockNodes, mockEdges);
      const pasted = manager.paste();
      
      const newNodeId1 = pasted?.nodes[0].id;
      const newNodeId2 = pasted?.nodes[1].id;
      
      expect(pasted?.edges[0].source).toBe(newNodeId1);
      expect(pasted?.edges[0].target).toBe(newNodeId2);
    });
    
    it('should generate new edge IDs on paste', () => {
      manager.copy(mockNodes, mockEdges);
      const pasted = manager.paste();
      
      expect(pasted?.edges[0].id).not.toBe('edge-1');
    });
  });
  
  describe('节点选择状态', () => {
    it('should set selected to false on paste', () => {
      const selectedNodes = mockNodes.map(n => ({ ...n, selected: true }));
      manager.copy(selectedNodes, mockEdges);
      
      const pasted = manager.paste();
      expect(pasted?.nodes[0].selected).toBe(false);
      expect(pasted?.nodes[1].selected).toBe(false);
    });
  });
  
  describe('剪切', () => {
    it('should work same as copy', () => {
      const data = manager.cut(mockNodes, mockEdges);
      
      expect(manager.hasData()).toBe(true);
      expect(data.nodes).toHaveLength(2);
    });
  });
});
