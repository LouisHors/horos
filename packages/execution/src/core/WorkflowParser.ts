import { WorkflowNode, WorkflowEdge } from '@horos/editor';
import { WorkflowDAG, DAGNode, DAGEdge } from '../types';

export class WorkflowParser {
  /**
   * 将工作流解析为 DAG
   */
  parse(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowDAG {
    const dagNodes = new Map<string, DAGNode>();
    const dagEdges: DAGEdge[] = [];
    
    // 初始化节点
    nodes.forEach(node => {
      dagNodes.set(node.id, {
        id: node.id,
        node,
        dependencies: [],
        dependents: [],
        level: 0,
      });
    });
    
    // 构建依赖关系
    edges.forEach(edge => {
      const sourceNode = dagNodes.get(edge.source);
      const targetNode = dagNodes.get(edge.target);
      
      if (sourceNode && targetNode) {
        sourceNode.dependents.push(edge.target);
        targetNode.dependencies.push(edge.source);
        
        dagEdges.push({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          edge,
        });
      }
    });
    
    // 计算层级
    const levels = this.calculateLevels(dagNodes);
    
    // 找出开始和结束节点
    const startNodes = nodes
      .filter(n => dagNodes.get(n.id)!.dependencies.length === 0)
      .map(n => n.id);
      
    const endNodes = nodes
      .filter(n => dagNodes.get(n.id)!.dependents.length === 0)
      .map(n => n.id);
    
    return {
      id: `dag_${Date.now()}`,
      nodes: dagNodes,
      edges: dagEdges,
      startNodes,
      endNodes,
      levels,
    };
  }
  
  /**
   * 计算每个节点的层级
   */
  private calculateLevels(nodes: Map<string, DAGNode>): string[][] {
    const levels: string[][] = [];
    const visited = new Set<string>();
    
    // 找到入度为0的节点
    let currentLevel = Array.from(nodes.values())
      .filter(n => n.dependencies.length === 0)
      .map(n => n.id);
    
    while (currentLevel.length > 0) {
      levels.push([...currentLevel]);
      currentLevel.forEach(id => visited.add(id));
      
      // 找到下一层
      const nextLevel = new Set<string>();
      currentLevel.forEach(id => {
        const node = nodes.get(id)!;
        node.dependents.forEach(depId => {
          const depNode = nodes.get(depId)!;
          // 检查所有依赖是否都已访问
          if (depNode.dependencies.every(d => visited.has(d))) {
            nextLevel.add(depId);
          }
        });
      });
      
      currentLevel = Array.from(nextLevel);
    }
    
    // 更新节点层级
    levels.forEach((level, index) => {
      level.forEach(id => {
        nodes.get(id)!.level = index;
      });
    });
    
    return levels;
  }
}
