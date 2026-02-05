import { describe, it, expect, beforeEach } from 'vitest';
import { useFlowStore } from './flowStore';
import { WorkflowNode, WorkflowEdge, NodeType } from '../types';

describe('flowStore', () => {
  beforeEach(() => {
    useFlowStore.setState({
      nodes: [],
      edges: [],
      selectedNodes: [],
      selectedEdges: [],
      reactFlowInstance: null,
    });
  });

  describe('initial state', () => {
    it('should have empty nodes and edges', () => {
      const state = useFlowStore.getState();
      expect(state.nodes).toEqual([]);
      expect(state.edges).toEqual([]);
    });

    it('should have empty selection', () => {
      const state = useFlowStore.getState();
      expect(state.selectedNodes).toEqual([]);
      expect(state.selectedEdges).toEqual([]);
    });
  });

  describe('node operations', () => {
    it('should add a node', () => {
      useFlowStore.getState().addNode({
        id: 'node-1',
        type: NodeType.AGENT,
        position: { x: 100, y: 200 },
        data: { label: 'Test Agent', type: NodeType.AGENT },
      } as WorkflowNode);

      const state = useFlowStore.getState();
      expect(state.nodes).toHaveLength(1);
      expect(state.nodes[0].id).toBe('node-1');
    });

    it('should remove a node', () => {
      useFlowStore.getState().addNode({
        id: 'node-1',
        type: NodeType.AGENT,
        position: { x: 100, y: 200 },
        data: { label: 'Test', type: NodeType.AGENT },
      } as WorkflowNode);

      useFlowStore.getState().removeNode('node-1');
      
      const state = useFlowStore.getState();
      expect(state.nodes).toHaveLength(0);
    });

    it('should update a node', () => {
      useFlowStore.getState().addNode({
        id: 'node-1',
        type: NodeType.AGENT,
        position: { x: 100, y: 200 },
        data: { label: 'Old Label', type: NodeType.AGENT },
      } as WorkflowNode);

      useFlowStore.getState().updateNode('node-1', { label: 'New Label' });

      const state = useFlowStore.getState();
      expect(state.nodes[0].data.label).toBe('New Label');
    });
  });

  describe('edge operations', () => {
    it('should add an edge', () => {
      useFlowStore.getState().addEdge({
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        type: 'custom',
      } as WorkflowEdge);

      const state = useFlowStore.getState();
      expect(state.edges).toHaveLength(1);
      expect(state.edges[0].source).toBe('node-1');
    });

    it('should remove an edge', () => {
      useFlowStore.getState().addEdge({
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
      } as WorkflowEdge);

      useFlowStore.getState().removeEdge('edge-1');
      
      const state = useFlowStore.getState();
      expect(state.edges).toHaveLength(0);
    });
  });

  describe('selection', () => {
    it('should set selected nodes', () => {
      useFlowStore.getState().setSelectedNodes(['node-1', 'node-2']);

      const state = useFlowStore.getState();
      expect(state.selectedNodes).toEqual(['node-1', 'node-2']);
    });

    it('should clear selection', () => {
      useFlowStore.getState().setSelectedNodes(['node-1']);
      useFlowStore.getState().clearSelection();

      const state = useFlowStore.getState();
      expect(state.selectedNodes).toEqual([]);
    });
  });
});
