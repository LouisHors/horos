import { describe, it, expect, beforeEach } from 'vitest';
import { useFlowStore } from '../stores/flowStore';
import { NodeType } from '../types';

describe('useFlowState (via flowStore)', () => {
  beforeEach(() => {
    useFlowStore.getState().resetCanvas();
  });

  describe('节点操作', () => {
    it('should add a node via store', () => {
      const node = {
        id: 'test-1',
        type: NodeType.AGENT,
        position: { x: 100, y: 200 },
        data: { label: 'Test Agent' },
      };
      
      useFlowStore.getState().addNode(node);
      
      const state = useFlowStore.getState();
      expect(state.nodes).toHaveLength(1);
      expect(state.nodes[0].type).toBe(NodeType.AGENT);
      expect(state.getNode('test-1')).toBeDefined();
    });

    it('should update a node', () => {
      const node = {
        id: 'test-1',
        type: NodeType.AGENT,
        position: { x: 0, y: 0 },
        data: { label: 'Original' },
      };
      
      useFlowStore.getState().addNode(node);
      useFlowStore.getState().updateNode('test-1', { label: 'Updated' });
      
      expect(useFlowStore.getState().getNode('test-1')?.data.label).toBe('Updated');
    });

    it('should remove a node', () => {
      useFlowStore.getState().addNode({
        id: 'test-1',
        type: NodeType.AGENT,
        position: { x: 0, y: 0 },
        data: {},
      });
      
      useFlowStore.getState().removeNode('test-1');
      
      expect(useFlowStore.getState().nodes).toHaveLength(0);
    });

    it('should remove related edges when removing node', () => {
      useFlowStore.getState().addNode({
        id: 'node-1',
        type: NodeType.START,
        position: { x: 0, y: 0 },
        data: {},
      });
      
      useFlowStore.getState().addNode({
        id: 'node-2',
        type: NodeType.END,
        position: { x: 200, y: 0 },
        data: {},
      });
      
      useFlowStore.getState().addEdge({
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        type: 'custom',
      });
      
      useFlowStore.getState().removeNode('node-1');
      
      expect(useFlowStore.getState().edges).toHaveLength(0);
    });
  });

  describe('边操作', () => {
    it('should add an edge', () => {
      useFlowStore.getState().addEdge({
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        type: 'custom',
      });
      
      const state = useFlowStore.getState();
      expect(state.edges).toHaveLength(1);
      expect(state.getEdge('edge-1')).toBeDefined();
    });

    it('should remove an edge', () => {
      useFlowStore.getState().addEdge({
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        type: 'custom',
      });
      
      useFlowStore.getState().removeEdge('edge-1');
      
      expect(useFlowStore.getState().edges).toHaveLength(0);
    });
  });

  describe('选择操作', () => {
    it('should select nodes', () => {
      useFlowStore.getState().addNode({
        id: 'node-1',
        type: NodeType.AGENT,
        position: { x: 0, y: 0 },
        data: {},
      });
      
      useFlowStore.getState().setSelectedNodes(['node-1']);
      
      const state = useFlowStore.getState();
      expect(state.selectedNodes).toContain('node-1');
      expect(state.getSelectedNodes()).toHaveLength(1);
    });

    it('should clear selection', () => {
      useFlowStore.getState().addNode({
        id: 'node-1',
        type: NodeType.AGENT,
        position: { x: 0, y: 0 },
        data: {},
        selected: true,
      });
      
      useFlowStore.getState().setSelectedNodes(['node-1']);
      useFlowStore.getState().clearSelection();
      
      expect(useFlowStore.getState().selectedNodes).toHaveLength(0);
    });
  });

  describe('批量操作', () => {
    it('should remove multiple nodes', () => {
      useFlowStore.getState().addNode({ id: 'node-1', type: NodeType.AGENT, position: { x: 0, y: 0 }, data: {} });
      useFlowStore.getState().addNode({ id: 'node-2', type: NodeType.TOOL, position: { x: 100, y: 0 }, data: {} });
      useFlowStore.getState().addNode({ id: 'node-3', type: NodeType.END, position: { x: 200, y: 0 }, data: {} });
      
      useFlowStore.getState().removeNodes(['node-1', 'node-2']);
      
      const state = useFlowStore.getState();
      expect(state.nodes).toHaveLength(1);
      expect(state.getNode('node-3')).toBeDefined();
    });

    it('should remove multiple edges', () => {
      useFlowStore.getState().addEdge({ id: 'edge-1', source: 'a', target: 'b', type: 'custom' });
      useFlowStore.getState().addEdge({ id: 'edge-2', source: 'b', target: 'c', type: 'custom' });
      useFlowStore.getState().addEdge({ id: 'edge-3', source: 'c', target: 'd', type: 'custom' });
      
      useFlowStore.getState().removeEdges(['edge-1', 'edge-2']);
      
      const state = useFlowStore.getState();
      expect(state.edges).toHaveLength(1);
      expect(state.getEdge('edge-3')).toBeDefined();
    });
  });

  describe('状态管理', () => {
    it('should reset canvas to initial state', () => {
      useFlowStore.getState().addNode({
        id: 'node-1',
        type: NodeType.AGENT,
        position: { x: 0, y: 0 },
        data: {},
      });
      
      useFlowStore.getState().addEdge({
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        type: 'custom',
      });
      
      useFlowStore.getState().setSelectedNodes(['node-1']);
      
      useFlowStore.getState().resetCanvas();
      
      const state = useFlowStore.getState();
      expect(state.nodes).toHaveLength(0);
      expect(state.edges).toHaveLength(0);
      expect(state.selectedNodes).toHaveLength(0);
    });

    it('should set canvas state', () => {
      const newNodes = [
        { id: '1', type: NodeType.START, position: { x: 0, y: 0 }, data: {} },
      ];
      
      useFlowStore.getState().setCanvasState({ nodes: newNodes as any });
      
      expect(useFlowStore.getState().nodes).toHaveLength(1);
    });
  });

  describe('useFlowState hook structure', () => {
    it('should export useFlowState function', async () => {
      const { useFlowState } = await import('./useFlowState');
      expect(typeof useFlowState).toBe('function');
    });
  });
});
