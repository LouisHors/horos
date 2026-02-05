import { NodeDefinition } from '../types';

export class NodeRegistry {
  private nodes: Map<string, NodeDefinition> = new Map();

  /**
   * Register a new node type
   */
  register(definition: NodeDefinition): void {
    this.nodes.set(definition.type, definition);
  }

  /**
   * Unregister a node type
   */
  unregister(type: string): void {
    this.nodes.delete(type);
  }

  /**
   * Get a node definition by type
   */
  get(type: string): NodeDefinition | undefined {
    return this.nodes.get(type);
  }

  /**
   * Check if a node type is registered
   */
  has(type: string): boolean {
    return this.nodes.has(type);
  }

  /**
   * Get all registered node definitions
   */
  getAll(): NodeDefinition[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get all node types
   */
  getTypes(): string[] {
    return Array.from(this.nodes.keys());
  }

  /**
   * Get nodes by category
   */
  getByCategory(category: string): NodeDefinition[] {
    return this.getAll().filter((node) => node.category === category);
  }

  /**
   * Get all unique categories
   */
  getCategories(): string[] {
    const categories = new Set(this.getAll().map((node) => node.category));
    return Array.from(categories);
  }

  /**
   * Search nodes by name or description
   */
  search(query: string): NodeDefinition[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(
      (node) =>
        node.name.toLowerCase().includes(lowerQuery) ||
        node.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Create default node data for a type
   */
  createNodeData(type: string): Record<string, unknown> {
    const definition = this.get(type);
    if (!definition) {
      throw new Error(`Unknown node type: ${type}`);
    }
    return { ...definition.defaultData };
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.nodes.clear();
  }
}

// Export singleton instance
export const nodeRegistry = new NodeRegistry();
