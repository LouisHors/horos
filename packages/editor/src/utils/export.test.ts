import { describe, it, expect } from 'vitest';
import { exportToJSON, importFromJSON, exportToYAML } from './export';
import { WorkflowNode, WorkflowEdge, NodeType } from '../types';

describe('Export Utils', () => {
  const mockNodes: WorkflowNode[] = [
    { id: 'start', type: NodeType.START, position: { x: 0, y: 0 }, data: { label: 'Start' } },
    { id: 'end', type: NodeType.END, position: { x: 100, y: 0 }, data: { label: 'End' } },
  ];
  
  const mockEdges: WorkflowEdge[] = [
    { id: 'e1', source: 'start', target: 'end', type: 'custom' },
  ];
  
  describe('exportToJSON', () => {
    it('should export to JSON', () => {
      const json = exportToJSON(mockNodes, mockEdges, { name: 'Test Flow' });
      
      expect(json).toBeDefined();
      expect(typeof json).toBe('string');
      
      const parsed = JSON.parse(json);
      expect(parsed.name).toBe('Test Flow');
      expect(parsed.nodes).toHaveLength(2);
      expect(parsed.edges).toHaveLength(1);
    });
    
    it('should include metadata', () => {
      const json = exportToJSON(mockNodes, mockEdges, {}, { includeMetadata: true });
      const parsed = JSON.parse(json);
      
      expect(parsed._exportInfo).toBeDefined();
      expect(parsed._exportInfo.version).toBe('1.0');
    });
  });
  
  describe('importFromJSON', () => {
    it('should import from JSON', () => {
      const json = exportToJSON(mockNodes, mockEdges, { name: 'Test' });
      const result = importFromJSON(json);
      
      expect(result).toBeDefined();
      expect(result!.nodes).toHaveLength(2);
      expect(result!.edges).toHaveLength(1);
      expect(result!.metadata.name).toBe('Test');
    });
    
    it('should return null for invalid JSON', () => {
      const result = importFromJSON('invalid json');
      expect(result).toBeNull();
    });
    
    it('should return null for missing nodes', () => {
      const result = importFromJSON('{"name": "test"}');
      expect(result).toBeNull();
    });
  });
  
  describe('exportToYAML', () => {
    it('should export to YAML', () => {
      const yaml = exportToYAML(mockNodes, mockEdges, { name: 'Test Flow' });
      
      expect(yaml).toBeDefined();
      expect(typeof yaml).toBe('string');
      expect(yaml).toContain('name: Test Flow');
    });
  });
});
