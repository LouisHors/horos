import { describe, it, expect, beforeEach } from 'vitest';
import { useFlowStore } from '../stores/flowStore';
import { NodeRegistry } from '../core/NodeRegistry';
import { NodeType } from '../types';

describe('Integration Tests', () => {
  beforeEach(() => {
    useFlowStore.setState({
      nodes: [],
      edges: [],
      selectedNodes: [],
      selectedEdges: [],
      reactFlowInstance: null,
    });
  });

  describe('Store + Registry', () => {
    it('should create workflow with registered nodes', () => {
      const registry = new NodeRegistry();
      
      // Register node types
      registry.register({
        type: NodeType.START,
        name: 'Start',
        description: 'Start node',
        category: 'Flow',
        defaultData: { label: 'Start' },
      } as any);

      registry.register({
        type: NodeType.END,
        name: 'End',
        description: 'End node',
        category: 'Flow',
        defaultData: { label: 'End' },
      } as any);

      // Create workflow using store
      const store = useFlowStore.getState();
      
      store.addNode({
        id: 'start-1',
        type: NodeType.START,
        position: { x: 0, y: 0 },
        data: registry.createNodeData(NodeType.START),
      } as any);

      store.addNode({
        id: 'end-1',
        type: NodeType.END,
        position: { x: 200, y: 0 },
        data: registry.createNodeData(NodeType.END),
      } as any);

      // Connect nodes
      store.addEdge({
        id: 'edge-1',
        source: 'start-1',
        target: 'end-1',
        type: 'custom',
      } as any);

      // Verify workflow
      const state = useFlowStore.getState();
      expect(state.nodes).toHaveLength(2);
      expect(state.edges).toHaveLength(1);
      expect(state.nodes[0].data.label).toBe('Start');
      expect(state.nodes[1].data.label).toBe('End');
    });

    it('should handle complex workflow', () => {
      const store = useFlowStore.getState();

      // Create a simple workflow: Start -> Agent -> End
      const nodes = [
        { id: 'start', type: NodeType.START, x: 0, y: 0 },
        { id: 'agent', type: NodeType.AGENT, x: 200, y: 0 },
        { id: 'end', type: NodeType.END, x: 400, y: 0 },
      ];

      nodes.forEach((n) => {
        store.addNode({
          id: n.id,
          type: n.type,
          position: { x: n.x, y: n.y },
          data: { label: n.id, type: n.type },
        } as any);
      });

      // Create edges
      store.addEdge({ id: 'e1', source: 'start', target: 'agent' } as any);
      store.addEdge({ id: 'e2', source: 'agent', target: 'end' } as any);

      const state = useFlowStore.getState();
      expect(state.nodes).toHaveLength(3);
      expect(state.edges).toHaveLength(2);

      // Verify connections
      const edge1 = store.getEdge('e1');
      expect(edge1?.source).toBe('start');
      expect(edge1?.target).toBe('agent');
    });

    it('should maintain consistency when removing nodes', () => {
      const store = useFlowStore.getState();

      // Create nodes
      store.addNode({
        id: 'n1',
        type: NodeType.START,
        position: { x: 0, y: 0 },
        data: { label: 'n1' },
      } as any);

      store.addNode({
        id: 'n2',
        type: NodeType.END,
        position: { x: 200, y: 0 },
        data: { label: 'n2' },
      } as any);

      // Create edge
      store.addEdge({ id: 'e1', source: 'n1', target: 'n2' } as any);

      // Remove middle node (simulating removal)
      store.removeNode('n1');

      const state = useFlowStore.getState();
      // Edge should also be removed
      expect(state.edges).toHaveLength(0);
      expect(state.nodes).toHaveLength(1);
    });
  });
});
