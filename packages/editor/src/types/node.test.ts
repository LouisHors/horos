import { describe, it, expect } from 'vitest';
import { NodeType, BaseNodeData, AgentNodeData, ToolNodeData, ConditionNodeData } from './node';

describe('Node Types', () => {
  describe('NodeType Enum', () => {
    it('should have all required node types', () => {
      expect(NodeType.START).toBe('start');
      expect(NodeType.END).toBe('end');
      expect(NodeType.AGENT).toBe('agent');
      expect(NodeType.TOOL).toBe('tool');
      expect(NodeType.CONDITION).toBe('condition');
    });

    it('should have exactly 5 node types', () => {
      const types = Object.values(NodeType);
      expect(types).toHaveLength(5);
    });
  });

  describe('BaseNodeData', () => {
    it('should accept valid base node data', () => {
      const data: BaseNodeData = {
        label: 'Test Node',
        description: 'A test node',
        config: { key: 'value' },
      };

      expect(data.label).toBe('Test Node');
      expect(data.description).toBe('A test node');
      expect(data.config).toEqual({ key: 'value' });
    });

    it('should work with minimal data (label only)', () => {
      const data: BaseNodeData = {
        label: 'Minimal Node',
      };

      expect(data.label).toBe('Minimal Node');
      expect(data.description).toBeUndefined();
      expect(data.config).toBeUndefined();
    });
  });

  describe('AgentNodeData', () => {
    it('should accept valid agent node data', () => {
      const data: AgentNodeData = {
        label: 'My Agent',
        type: NodeType.AGENT,
        agentId: 'agent-123',
        model: 'gpt-4',
        systemPrompt: 'You are a helpful assistant',
        temperature: 0.7,
      };

      expect(data.type).toBe(NodeType.AGENT);
      expect(data.model).toBe('gpt-4');
      expect(data.temperature).toBe(0.7);
    });

    it('should work with optional fields omitted', () => {
      const data: AgentNodeData = {
        label: 'Simple Agent',
        type: NodeType.AGENT,
      };

      expect(data.type).toBe(NodeType.AGENT);
      expect(data.model).toBeUndefined();
      expect(data.temperature).toBeUndefined();
    });

    it('should use correct temperature type', () => {
      const data: AgentNodeData = {
        label: 'Agent',
        type: NodeType.AGENT,
        temperature: 0.5,
      };

      expect(typeof data.temperature).toBe('number');
      expect(data.temperature).toBeGreaterThanOrEqual(0);
      expect(data.temperature).toBeLessThanOrEqual(2);
    });
  });

  describe('ToolNodeData', () => {
    it('should accept valid tool node data', () => {
      const data: ToolNodeData = {
        label: 'Search Tool',
        type: NodeType.TOOL,
        toolName: 'web_search',
        description: 'Search the web',
        toolConfig: { apiKey: 'xxx', limit: 10 },
      };

      expect(data.type).toBe(NodeType.TOOL);
      expect(data.toolName).toBe('web_search');
      expect(data.toolConfig).toHaveProperty('apiKey');
    });

    it('should work without toolConfig', () => {
      const data: ToolNodeData = {
        label: 'Simple Tool',
        type: NodeType.TOOL,
        toolName: 'calculator',
      };

      expect(data.toolConfig).toBeUndefined();
    });
  });

  describe('ConditionNodeData', () => {
    it('should accept valid condition node data', () => {
      const data: ConditionNodeData = {
        label: 'If Statement',
        type: NodeType.CONDITION,
        condition: 'score > 0.5',
        branches: [
          { label: 'True', condition: 'score > 0.5' },
          { label: 'False', condition: 'score <= 0.5' },
        ],
      };

      expect(data.type).toBe(NodeType.CONDITION);
      expect(data.branches).toHaveLength(2);
      expect(data.branches?.[0].label).toBe('True');
    });

    it('should allow empty branches', () => {
      const data: ConditionNodeData = {
        label: 'Condition',
        type: NodeType.CONDITION,
      };

      expect(data.branches).toBeUndefined();
      expect(data.condition).toBeUndefined();
    });
  });
});
