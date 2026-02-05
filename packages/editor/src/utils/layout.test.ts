import { describe, it, expect } from 'vitest';
import { applyHierarchyLayout } from './layout';
import { checkConnectivity } from './validation';
import { WorkflowNode, WorkflowEdge, NodeType } from '../types';

describe('Layout Utils', () => {
  const mockNodes: WorkflowNode[] = [
    { id: 'start', type: NodeType.START, position: { x: 0, y: 0 }, data: {} },
    { id: 'agent1', type: NodeType.AGENT, position: { x: 0, y: 0 }, data: {} },
    { id: 'agent2', type: NodeType.AGENT, position: { x: 0, y: 0 }, data: {} },
    { id: 'end', type: NodeType.END, position: { x: 0, y: 0 }, data: {} },
  ];
  
  const mockEdges: WorkflowEdge[] = [
    { id: 'e1', source: 'start', target: 'agent1', type: 'custom' },
    { id: 'e2', source: 'start', target: 'agent2', type: 'custom' },
    { id: 'e3', source: 'agent1', target: 'end', type: 'custom' },
    { id: 'e4', source: 'agent2', target: 'end', type: 'custom' },
  ];
  
  describe('applyHierarchyLayout', () => {
    it('should layout nodes in hierarchical order', () => {
      const result = applyHierarchyLayout(mockNodes, mockEdges);
      
      expect(result.nodes).toHaveLength(4);
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
      
      // Start node should be at top (lower y)
      const startNode = result.nodes.find(n => n.id === 'start');
      const endNode = result.nodes.find(n => n.id === 'end');
      
      expect(startNode!.position.y).toBeLessThan(endNode!.position.y);
    });
    
    it('should handle empty nodes', () => {
      const result = applyHierarchyLayout([], []);
      
      expect(result.nodes).toHaveLength(0);
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
    });
  });
  
  describe('checkConnectivity', () => {
    it('should detect connected graph', () => {
      const result = checkConnectivity(mockNodes, mockEdges);
      
      expect(result.connected).toBe(true);
      expect(result.components).toHaveLength(1);
      expect(result.isolatedNodes).toHaveLength(0);
    });
    
    it('should detect isolated nodes', () => {
      const nodesWithIsolated = [
        ...mockNodes,
        { id: 'isolated', type: NodeType.TOOL, position: { x: 0, y: 0 }, data: {} },
      ];
      
      const result = checkConnectivity(nodesWithIsolated, mockEdges);
      
      expect(result.connected).toBe(false);
      expect(result.isolatedNodes).toContain('isolated');
    });
  });
});
