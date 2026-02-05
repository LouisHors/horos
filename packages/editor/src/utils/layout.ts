import { WorkflowNode, WorkflowEdge } from '../types';

// Dagre 布局选项
export interface DagreLayoutOptions {
  rankdir?: 'TB' | 'BT' | 'LR' | 'RL';  // 方向: 从上到下/下到上/左到右/右到左
  align?: 'UL' | 'UR' | 'DL' | 'DR';     // 对齐
  nodesep?: number;                       // 节点间距
  ranksep?: number;                       // 层间距
  marginx?: number;                       // 水平边距
  marginy?: number;                       // 垂直边距
}

// 布局结果
export interface LayoutResult {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  width: number;
  height: number;
}

/**
 * 简单的层次布局算法（不依赖 Dagre）
 * 用于自动排列节点
 */
export function applyHierarchyLayout(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  options: DagreLayoutOptions = {}
): LayoutResult {
  const {
    rankdir = 'TB',
    nodesep = 200,
    ranksep = 150,
    marginx = 50,
    marginy = 50,
  } = options;

  // 构建邻接表
  const adjacency = buildAdjacency(nodes, edges);
  
  // 计算每个节点的层级
  const levels = calculateLevels(nodes, adjacency);
  
  // 计算每层的节点数
  const levelCounts: Map<number, number> = new Map();
  const nodePositions: Map<string, { x: number; y: number }> = new Map();
  
  nodes.forEach(node => {
    const level = levels.get(node.id) || 0;
    levelCounts.set(level, (levelCounts.get(level) || 0) + 1);
  });
  
  // 放置节点
  const levelOffsets: Map<number, number> = new Map();
  
  const newNodes = nodes.map(node => {
    const level = levels.get(node.id) || 0;
    const indexInLevel = levelOffsets.get(level) || 0;
    const countInLevel = levelCounts.get(level) || 1;
    
    levelOffsets.set(level, indexInLevel + 1);
    
    let x: number, y: number;
    
    if (rankdir === 'TB' || rankdir === 'BT') {
      // 垂直布局
      const levelWidth = (countInLevel - 1) * nodesep;
      x = marginx + indexInLevel * nodesep;
      y = marginy + level * ranksep;
      
      // 居中对齐
      x = x - levelWidth / 2 + nodesep / 2;
    } else {
      // 水平布局
      const levelHeight = (countInLevel - 1) * nodesep;
      x = marginx + level * ranksep;
      y = marginy + indexInLevel * nodesep;
      
      // 居中对齐
      y = y - levelHeight / 2 + nodesep / 2;
    }
    
    nodePositions.set(node.id, { x, y });
    
    return {
      ...node,
      position: { x, y },
    };
  });
  
  // 计算画布大小
  const maxLevel = Math.max(...Array.from(levels.values()), 0);
  const maxCount = Math.max(...Array.from(levelCounts.values()), 1);
  
  let width: number, height: number;
  
  if (rankdir === 'TB' || rankdir === 'BT') {
    width = maxCount * nodesep + marginx * 2;
    height = (maxLevel + 1) * ranksep + marginy * 2;
  } else {
    width = (maxLevel + 1) * ranksep + marginx * 2;
    height = maxCount * nodesep + marginy * 2;
  }
  
  return {
    nodes: newNodes,
    edges,
    width,
    height,
  };
}

/**
 * 构建邻接表
 */
function buildAdjacency(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): Map<string, string[]> {
  const adjacency = new Map<string, string[]>();
  
  // 初始化
  nodes.forEach(node => {
    adjacency.set(node.id, []);
  });
  
  // 添加边
  edges.forEach(edge => {
    const neighbors = adjacency.get(edge.source) || [];
    neighbors.push(edge.target);
    adjacency.set(edge.source, neighbors);
  });
  
  return adjacency;
}

/**
 * 计算每个节点的层级（拓扑排序）
 */
function calculateLevels(
  nodes: WorkflowNode[],
  adjacency: Map<string, string[]>
): Map<string, number> {
  const levels = new Map<string, number>();
  const inDegree = new Map<string, number>();
  
  // 计算入度
  nodes.forEach(node => {
    inDegree.set(node.id, 0);
  });
  
  nodes.forEach(node => {
    const neighbors = adjacency.get(node.id) || [];
    neighbors.forEach(targetId => {
      inDegree.set(targetId, (inDegree.get(targetId) || 0) + 1);
    });
  });
  
  // 找到所有入度为 0 的节点
  const queue: string[] = [];
  nodes.forEach(node => {
    if ((inDegree.get(node.id) || 0) === 0) {
      queue.push(node.id);
      levels.set(node.id, 0);
    }
  });
  
  // BFS
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const currentLevel = levels.get(nodeId) || 0;
    
    const neighbors = adjacency.get(nodeId) || [];
    neighbors.forEach(targetId => {
      const newInDegree = (inDegree.get(targetId) || 0) - 1;
      inDegree.set(targetId, newInDegree);
      
      if (newInDegree === 0) {
        queue.push(targetId);
        levels.set(targetId, currentLevel + 1);
      }
    });
  }
  
  // 处理循环依赖（未访问的节点）
  nodes.forEach(node => {
    if (!levels.has(node.id)) {
      levels.set(node.id, 0);
    }
  });
  
  return levels;
}

/**
 * 力导向布局（简单实现）
 */
export function applyForceLayout(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  iterations: number = 100
): LayoutResult {
  const nodePositions = new Map<string, { x: number; y: number }>();
  
  // 初始化随机位置
  nodes.forEach(node => {
    nodePositions.set(node.id, {
      x: node.position.x + (Math.random() - 0.5) * 100,
      y: node.position.y + (Math.random() - 0.5) * 100,
    });
  });
  
  // 简单的力导向迭代
  for (let i = 0; i < iterations; i++) {
    // 斥力
    nodes.forEach(nodeA => {
      nodes.forEach(nodeB => {
        if (nodeA.id === nodeB.id) return;
        
        const posA = nodePositions.get(nodeA.id)!;
        const posB = nodePositions.get(nodeB.id)!;
        
        const dx = posA.x - posB.x;
        const dy = posA.y - posB.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const force = 1000 / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        
        posA.x += fx * 0.1;
        posA.y += fy * 0.1;
      });
    });
    
    // 引力（边）
    edges.forEach(edge => {
      const posA = nodePositions.get(edge.source);
      const posB = nodePositions.get(edge.target);
      
      if (!posA || !posB) return;
      
      const dx = posB.x - posA.x;
      const dy = posB.y - posA.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      
      const force = (dist - 150) * 0.01;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      
      posA.x += fx;
      posA.y += fy;
      posB.x -= fx;
      posB.y -= fy;
    });
  }
  
  // 应用位置
  const newNodes = nodes.map(node => ({
    ...node,
    position: nodePositions.get(node.id) || node.position,
  }));
  
  // 计算边界
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  nodePositions.forEach(pos => {
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x);
    maxY = Math.max(maxY, pos.y);
  });
  
  return {
    nodes: newNodes,
    edges,
    width: maxX - minX + 200,
    height: maxY - minY + 200,
  };
}

/**
 * 自动布局（根据节点数量选择算法）
 */
export function autoLayout(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  options?: DagreLayoutOptions
): LayoutResult {
  if (nodes.length <= 20) {
    return applyHierarchyLayout(nodes, edges, options);
  } else {
    return applyForceLayout(nodes, edges);
  }
}

export default {
  applyHierarchyLayout,
  applyForceLayout,
  autoLayout,
};
