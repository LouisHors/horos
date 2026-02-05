import { describe, it, expect, beforeEach } from 'vitest';
import { NodeRegistry } from './NodeRegistry';
import { NodeType } from '../types';

describe('NodeRegistry', () => {
  let registry: NodeRegistry;

  beforeEach(() => {
    registry = new NodeRegistry();
  });

  describe('registration', () => {
    it('should register a node type', () => {
      const definition = {
        type: NodeType.AGENT,
        name: 'Agent',
        description: 'An AI agent',
        category: 'AI',
        icon: 'bot',
        defaultData: { label: 'New Agent' },
      };

      registry.register(definition as any);

      expect(registry.get(NodeType.AGENT)).toBeDefined();
    });

    it('should get all registered nodes', () => {
      registry.register({
        type: NodeType.AGENT,
        name: 'Agent',
        description: 'An AI agent',
        category: 'AI',
        defaultData: {},
      } as any);

      registry.register({
        type: NodeType.TOOL,
        name: 'Tool',
        description: 'A tool',
        category: 'Tools',
        defaultData: {},
      } as any);

      const allNodes = registry.getAll();
      expect(allNodes).toHaveLength(2);
    });

    it('should get nodes by category', () => {
      registry.register({
        type: NodeType.AGENT,
        name: 'Agent',
        description: 'An AI agent',
        category: 'AI',
        defaultData: {},
      } as any);

      const aiNodes = registry.getByCategory('AI');
      expect(aiNodes).toHaveLength(1);
      expect(aiNodes[0].type).toBe(NodeType.AGENT);
    });

    it('should get all categories', () => {
      registry.register({
        type: NodeType.AGENT,
        name: 'Agent',
        description: 'An AI agent',
        category: 'AI',
        defaultData: {},
      } as any);

      registry.register({
        type: NodeType.TOOL,
        name: 'Tool',
        description: 'A tool',
        category: 'Tools',
        defaultData: {},
      } as any);

      const categories = registry.getCategories();
      expect(categories).toContain('AI');
      expect(categories).toContain('Tools');
    });

    it('should check if node type exists', () => {
      registry.register({
        type: NodeType.AGENT,
        name: 'Agent',
        description: 'An AI agent',
        category: 'AI',
        defaultData: {},
      } as any);

      expect(registry.has(NodeType.AGENT)).toBe(true);
      expect(registry.has(NodeType.TOOL)).toBe(false);
    });

    it('should create node data with defaults', () => {
      registry.register({
        type: NodeType.AGENT,
        name: 'Agent',
        description: 'An AI agent',
        category: 'AI',
        defaultData: { label: 'New Agent', model: 'gpt-4' },
      } as any);

      const data = registry.createNodeData(NodeType.AGENT);
      expect(data).toEqual({ label: 'New Agent', model: 'gpt-4' });
    });

    it('should unregister a node type', () => {
      registry.register({
        type: NodeType.AGENT,
        name: 'Agent',
        description: 'An AI agent',
        category: 'AI',
        defaultData: {},
      } as any);

      expect(registry.has(NodeType.AGENT)).toBe(true);

      registry.unregister(NodeType.AGENT);

      expect(registry.has(NodeType.AGENT)).toBe(false);
    });
  });

  describe('search', () => {
    beforeEach(() => {
      registry.register({
        type: NodeType.AGENT,
        name: 'AI Agent',
        description: 'An intelligent agent',
        category: 'AI',
        defaultData: {},
      } as any);

      registry.register({
        type: NodeType.TOOL,
        name: 'Web Search',
        description: 'Search the web',
        category: 'Tools',
        defaultData: {},
      } as any);
    });

    it('should search by name', () => {
      const results = registry.search('agent');
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe(NodeType.AGENT);
    });

    it('should search by description', () => {
      const results = registry.search('search');
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe(NodeType.TOOL);
    });

    it('should return empty array for no matches', () => {
      const results = registry.search('nonexistent');
      expect(results).toHaveLength(0);
    });
  });
});
