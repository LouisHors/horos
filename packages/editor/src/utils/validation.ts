import { WorkflowNode, WorkflowEdge, NodeType } from '../types';

// 验证结果
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

// 验证错误
export interface ValidationError {
  type: 'error';
  code: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
}

// 验证警告
export interface ValidationWarning {
  type: 'warning';
  code: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
}

// 验证规则
export interface ValidationRule {
  code: string;
  message: string;
  validate: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => (ValidationError | ValidationWarning)[];
}

/**
 * 验证工作流
 */
export function validateFlow(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  rules: ValidationRule[] = defaultValidationRules
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  rules.forEach(rule => {
    const results = rule.validate(nodes, edges);
    results.forEach(result => {
      if (result.type === 'error') {
        errors.push(result as ValidationError);
      } else {
        warnings.push(result as ValidationWarning);
      }
    });
  });
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 检查循环
 */
export function detectCycles(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[][] {
  const adjacency = buildAdjacency(nodes, edges);
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recStack = new Set<string>();
  const path: string[] = [];
  
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      dfs(node.id, adjacency, visited, recStack, path, cycles);
    }
  });
  
  return cycles;
}

/**
 * DFS 检测循环
 */
function dfs(
  nodeId: string,
  adjacency: Map<string, string[]>,
  visited: Set<string>,
  recStack: Set<string>,
  path: string[],
  cycles: string[][]
): void {
  visited.add(nodeId);
  recStack.add(nodeId);
  path.push(nodeId);
  
  const neighbors = adjacency.get(nodeId) || [];
  neighbors.forEach(neighborId => {
    if (!visited.has(neighborId)) {
      dfs(neighborId, adjacency, visited, recStack, path, cycles);
    } else if (recStack.has(neighborId)) {
      // 发现循环
      const cycleStart = path.indexOf(neighborId);
      const cycle = path.slice(cycleStart).concat([neighborId]);
      cycles.push(cycle);
    }
  });
  
  path.pop();
  recStack.delete(nodeId);
}

/**
 * 构建邻接表
 */
function buildAdjacency(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): Map<string, string[]> {
  const adjacency = new Map<string, string[]>();
  
  nodes.forEach(node => {
    adjacency.set(node.id, []);
  });
  
  edges.forEach(edge => {
    const neighbors = adjacency.get(edge.source) || [];
    if (!neighbors.includes(edge.target)) {
      neighbors.push(edge.target);
      adjacency.set(edge.source, neighbors);
    }
  });
  
  return adjacency;
}

/**
 * 检查连通性
 */
export function checkConnectivity(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): {
  connected: boolean;
  components: string[][];
  isolatedNodes: string[];
} {
  if (nodes.length === 0) {
    return { connected: true, components: [], isolatedNodes: [] };
  }
  
  const adjacency = buildAdjacency(nodes, edges);
  const visited = new Set<string>();
  const components: string[][] = [];
  
  // BFS 找连通分量
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      const component: string[] = [];
      const queue = [node.id];
      visited.add(node.id);
      
      while (queue.length > 0) {
        const currentId = queue.shift()!;
        component.push(currentId);
        
        // 获取邻居（包括入边和出边）
        const neighbors = adjacency.get(currentId) || [];
        neighbors.forEach(neighborId => {
          if (!visited.has(neighborId)) {
            visited.add(neighborId);
            queue.push(neighborId);
          }
        });
        
        // 检查入边
        edges.forEach(edge => {
          if (edge.target === currentId && !visited.has(edge.source)) {
            visited.add(edge.source);
            queue.push(edge.source);
          }
        });
      }
      
      components.push(component);
    }
  });
  
  // 找孤立节点
  const isolatedNodes = nodes
    .filter(node => {
      const hasOutgoing = (adjacency.get(node.id) || []).length > 0;
      const hasIncoming = edges.some(e => e.target === node.id);
      return !hasOutgoing && !hasIncoming;
    })
    .map(node => node.id);
  
  return {
    connected: components.length === 1 && isolatedNodes.length === 0,
    components,
    isolatedNodes,
  };
}

/**
 * 默认验证规则
 */
const defaultValidationRules: ValidationRule[] = [
  // 检查是否有开始节点
  {
    code: 'NO_START_NODE',
    message: 'Workflow must have at least one Start node',
    validate: (nodes) => {
      const hasStart = nodes.some(node => node.type === NodeType.START);
      if (!hasStart) {
        return [{
          type: 'error',
          code: 'NO_START_NODE',
          message: 'Workflow must have at least one Start node',
        }];
      }
      return [];
    },
  },
  
  // 检查是否有结束节点
  {
    code: 'NO_END_NODE',
    message: 'Workflow should have at least one End node',
    validate: (nodes) => {
      const hasEnd = nodes.some(node => node.type === NodeType.END);
      if (!hasEnd) {
        return [{
          type: 'warning',
          code: 'NO_END_NODE',
          message: 'Workflow should have at least one End node',
        }];
      }
      return [];
    },
  },
  
  // 检查循环
  {
    code: 'CYCLE_DETECTED',
    message: 'Workflow contains cycles',
    validate: (nodes, edges) => {
      const cycles = detectCycles(nodes, edges);
      return cycles.map(cycle => ({
        type: 'error' as const,
        code: 'CYCLE_DETECTED',
        message: `Cycle detected: ${cycle.join(' -> ')}`,
        nodeId: cycle[0],
      }));
    },
  },
  
  // 检查孤立节点
  {
    code: 'ISOLATED_NODE',
    message: 'Node is not connected to any other node',
    validate: (nodes, edges) => {
      const isolated = nodes.filter(node => {
        const hasOutgoing = edges.some(e => e.source === node.id);
        const hasIncoming = edges.some(e => e.target === node.id);
        return !hasOutgoing && !hasIncoming;
      });
      
      return isolated.map(node => ({
        type: 'warning' as const,
        code: 'ISOLATED_NODE',
        message: `Node "${node.data.label || node.id}" is isolated`,
        nodeId: node.id,
      }));
    },
  },
  
  // 检查无效连接
  {
    code: 'INVALID_CONNECTION',
    message: 'Edge references non-existent node',
    validate: (nodes, edges) => {
      const nodeIds = new Set(nodes.map(n => n.id));
      const invalid: ValidationError[] = [];
      
      edges.forEach(edge => {
        if (!nodeIds.has(edge.source)) {
          invalid.push({
            type: 'error',
            code: 'INVALID_CONNECTION',
            message: `Edge references non-existent source node: ${edge.source}`,
            edgeId: edge.id,
          });
        }
        if (!nodeIds.has(edge.target)) {
          invalid.push({
            type: 'error',
            code: 'INVALID_CONNECTION',
            message: `Edge references non-existent target node: ${edge.target}`,
            edgeId: edge.id,
          });
        }
      });
      
      return invalid;
    },
  },
  
  // 检查重复边
  {
    code: 'DUPLICATE_EDGE',
    message: 'Multiple edges between the same nodes',
    validate: (_nodes, edges) => {
      const edgeMap = new Map<string, number>();
      const duplicates: ValidationWarning[] = [];
      
      edges.forEach(edge => {
        const key = `${edge.source}-${edge.target}`;
        const count = (edgeMap.get(key) || 0) + 1;
        edgeMap.set(key, count);
        
        if (count === 2) {
          duplicates.push({
            type: 'warning',
            code: 'DUPLICATE_EDGE',
            message: `Multiple edges from ${edge.source} to ${edge.target}`,
            edgeId: edge.id,
          });
        }
      });
      
      return duplicates;
    },
  },
];

export default {
  validateFlow,
  detectCycles,
  checkConnectivity,
  defaultValidationRules,
};
