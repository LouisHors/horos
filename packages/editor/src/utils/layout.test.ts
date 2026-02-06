import { describe, it, expect } from 'vitest';
import { applyHierarchyLayout } from './layout';
import { checkConnectivity } from './validation';
import { WorkflowNode, WorkflowEdge, NodeType } from '../types';

describe('Layout Utils', () => {
  const mockNodes: WorkflowNode[] = [
    { id: 'start', type: NodeType.START, position: { x: 0, y: 0 }, data: { type: NodeType.START, label: 'Start' } },
    { id: 'agent1', type: NodeType.AGENT, position: { x: 0, y: 0 }, data: { type: NodeType.AGENT, label: 'Agent 1' } },
    { id: 'agent2', type: NodeType.AGENT, position: { x: 0, y: 0 }, data: { type: NodeType.AGENT, label: 'Agent 2' } },
    { id: 'end', type: NodeType.END, position: { x: 0, y: 0 }, data: { type: NodeType.END, label: 'End' } },
  ];
  
  const mockEdges: WorkflowEdge[] = [
    { id: 'e1', source: 'start', target: 'agent1', type: 'custom' },
    { id: 'e2', source: 'start', target: 'agent2', type: 'custom' },
    { id: 'e3', source: 'agent1', target: 'end', type: 'custom' },
    { id: 'e4', source: 'agent2', target: 'end', type: 'custom' },
  ];
  
  const mockDimensions = new Map([
    ['start', { width: 180, height: 80 }],
    ['agent1', { width: 180, height: 80 }],
    ['agent2', { width: 180, height: 80 }],
    ['end', { width: 180, height: 80 }],
  ]);

  describe('applyHierarchyLayout', () => {
    it('should layout nodes in hierarchical structure', () => {
      const result = applyHierarchyLayout(mockNodes, mockDimensions);
      
      expect(result.nodes).toHaveLength(4);
      expect(result.edges).toHaveLength(4);
      
      // 检查 start 节点在最上层
      const startNode = result.nodes.find(n => n.id === 'start');
      expect(startNode?.position.y).toBeLessThan(200);
    });

    it('should handle empty nodes', () => {
      const result = applyHierarchyLayout([], new Map());
      
      expect(result.nodes).toHaveLength(0);
      expect(result.edges).toHaveLength(0);
    });

    it('should handle single node', () => {
      const singleNode: WorkflowNode[] = [
        { id: 'start', type: NodeType.START, position: { x: 0, y: 0 }, data: { type: NodeType.START, label: 'Start' } }
      ];
      const result = applyHierarchyLayout(singleNode, new Map([['start', { width: 180, height: 80 }]]));
      
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].position.x).toBeGreaterThanOrEqual(0);
    });

    it('should layout disconnected nodes', () => {
      const disconnectedNodes: WorkflowNode[] = [
        { id: 'start', type: NodeType.START, position: { x: 0, y: 0 }, data: { type: NodeType.START, label: 'Start' } },
        { id: 'isolated', type: NodeType.TOOL, position: { x: 0, y: 0 }, data: { type: NodeType.TOOL, label: 'Isolated' } },
      ];
      const result = applyHierarchyLayout(disconnectedNodes, new Map([
        ['start', { width: 180, height: 80 }],
        ['isolated', { width: 180, height: 80 }],
      ]));
      
      expect(result.nodes).toHaveLength(2);
    });
  });

  describe('checkConnectivity', () => {
    it('should detect fully connected graph', () => {
      const result = checkConnectivity(mockNodes, mockEdges);
      
      expect(result.isConnected).toBe(true);
      expect(result.components).toHaveLength(1);
    });
  });
});
