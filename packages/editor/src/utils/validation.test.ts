import { describe, it, expect } from 'vitest';
import { validateFlow, detectCycles } from './validation';
import { WorkflowNode, WorkflowEdge, NodeType } from '../types';

describe('Validation Utils', () => {
  describe('validateFlow', () => {
    it('should validate workflow with start and end nodes', () => {
      const nodes: WorkflowNode[] = [
        { id: 'start', type: NodeType.START, position: { x: 0, y: 0 }, data: {} },
        { id: 'end', type: NodeType.END, position: { x: 100, y: 0 }, data: {} },
      ];
      const edges: WorkflowEdge[] = [
        { id: 'e1', source: 'start', target: 'end', type: 'custom' },
      ];
      
      const result = validateFlow(nodes, edges);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should report error for missing start node', () => {
      const nodes: WorkflowNode[] = [
        { id: 'agent', type: NodeType.AGENT, position: { x: 0, y: 0 }, data: {} },
      ];
      const edges: WorkflowEdge[] = [];
      
      const result = validateFlow(nodes, edges);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'NO_START_NODE')).toBe(true);
    });
    
    it('should detect cycles', () => {
      const nodes: WorkflowNode[] = [
        { id: 'a', type: NodeType.AGENT, position: { x: 0, y: 0 }, data: {} },
        { id: 'b', type: NodeType.AGENT, position: { x: 100, y: 0 }, data: {} },
      ];
      const edges: WorkflowEdge[] = [
        { id: 'e1', source: 'a', target: 'b', type: 'custom' },
        { id: 'e2', source: 'b', target: 'a', type: 'custom' },
      ];
      
      const result = validateFlow(nodes, edges);
      
      expect(result.errors.some(e => e.code === 'CYCLE_DETECTED')).toBe(true);
    });
  });
  
  describe('detectCycles', () => {
    it('should detect simple cycle', () => {
      const nodes: WorkflowNode[] = [
        { id: 'a', type: NodeType.AGENT, position: { x: 0, y: 0 }, data: {} },
        { id: 'b', type: NodeType.AGENT, position: { x: 100, y: 0 }, data: {} },
      ];
      const edges: WorkflowEdge[] = [
        { id: 'e1', source: 'a', target: 'b', type: 'custom' },
        { id: 'e2', source: 'b', target: 'a', type: 'custom' },
      ];
      
      const cycles = detectCycles(nodes, edges);
      
      expect(cycles.length).toBeGreaterThan(0);
    });
    
    it('should return empty for acyclic graph', () => {
      const nodes: WorkflowNode[] = [
        { id: 'a', type: NodeType.AGENT, position: { x: 0, y: 0 }, data: {} },
        { id: 'b', type: NodeType.AGENT, position: { x: 100, y: 0 }, data: {} },
      ];
      const edges: WorkflowEdge[] = [
        { id: 'e1', source: 'a', target: 'b', type: 'custom' },
      ];
      
      const cycles = detectCycles(nodes, edges);
      
      expect(cycles).toHaveLength(0);
    });
  });
});
