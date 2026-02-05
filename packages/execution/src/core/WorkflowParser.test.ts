import { describe, it, expect } from 'vitest';
import { WorkflowParser } from './WorkflowParser';
import { WorkflowNode, WorkflowEdge, NodeType } from '../types';

describe('WorkflowParser', () => {
  const parser = new WorkflowParser();
  
  const createNode = (id: string, type: string): WorkflowNode => ({
    id,
    type,
    data: {},
    position: { x: 0, y: 0 },
  });

  it('should parse simple linear workflow', () => {
    const nodes: WorkflowNode[] = [
      createNode('start', NodeType.START),
      createNode('agent', NodeType.AGENT),
      createNode('end', NodeType.END),
    ];
    const edges: WorkflowEdge[] = [
      { id: 'e1', source: 'start', target: 'agent' },
      { id: 'e2', source: 'agent', target: 'end' },
    ];

    const dag = parser.parseWorkflow(nodes, edges);

    expect(dag.nodes).toHaveLength(3);
    expect(dag.edges).toHaveLength(2);
    expect(dag.executionOrder).toHaveLength(3);
    expect(dag.executionOrder[0]).toContain('start');
    expect(dag.executionOrder[2]).toContain('end');
  });

  it('should parse parallel workflow', () => {
    const nodes: WorkflowNode[] = [
      createNode('start', NodeType.START),
      createNode('agent1', NodeType.AGENT),
      createNode('agent2', NodeType.AGENT),
      createNode('end', NodeType.END),
    ];
    const edges: WorkflowEdge[] = [
      { id: 'e1', source: 'start', target: 'agent1' },
      { id: 'e2', source: 'start', target: 'agent2' },
      { id: 'e3', source: 'agent1', target: 'end' },
      { id: 'e4', source: 'agent2', target: 'end' },
    ];

    const dag = parser.parseWorkflow(nodes, edges);

    expect(dag.executionOrder).toHaveLength(3);
    expect(dag.executionOrder[1]).toHaveLength(2); // agent1, agent2 同级
  });
});
