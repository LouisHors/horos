import { describe, it, expect } from 'vitest';
import { WorkflowParser } from './WorkflowParser';
import { WorkflowNode, WorkflowEdge, NodeType } from '@horos/editor';

describe('WorkflowParser', () => {
  const parser = new WorkflowParser();
  
  const mockNodes: WorkflowNode[] = [
    { id: 'start', type: NodeType.START, position: { x: 0, y: 0 }, data: {} },
    { id: 'agent', type: NodeType.AGENT, position: { x: 100, y: 0 }, data: {} },
    { id: 'end', type: NodeType.END, position: { x: 200, y: 0 }, data: {} },
  ];
  
  const mockEdges: WorkflowEdge[] = [
    { id: 'e1', source: 'start', target: 'agent', type: 'custom' },
    { id: 'e2', source: 'agent', target: 'end', type: 'custom' },
  ];
  
  it('should parse workflow to DAG', () => {
    const dag = parser.parse(mockNodes, mockEdges);
    
    expect(dag).toBeDefined();
    expect(dag.nodes.size).toBe(3);
    expect(dag.startNodes).toContain('start');
    expect(dag.endNodes).toContain('end');
  });
  
  it('should calculate correct levels', () => {
    const dag = parser.parse(mockNodes, mockEdges);
    
    expect(dag.levels).toHaveLength(3);
    expect(dag.levels[0]).toContain('start');
    expect(dag.levels[2]).toContain('end');
  });
});
