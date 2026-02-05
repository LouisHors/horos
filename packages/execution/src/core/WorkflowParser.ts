import { WorkflowNode, WorkflowEdge, DAGNode, DAGEdge, DAG } from '../types';

/**
 * 将 ReactFlow 的 nodes/edges 转换为可执行的 DAG
 */
export class WorkflowParser {
  /**
   * 解析工作流
   */
  parseWorkflow(nodes: WorkflowNode[], edges: WorkflowEdge[]): DAG {
    const dagNodes: DAGNode[] = nodes.map(node => ({
      id: node.id,
      type: node.type,
      data: node.data,
      inputs: this.getNodeInputs(node.id, edges),
      outputs: this.getNodeOutputs(node.id, edges),
    }));

    const dagEdges: DAGEdge[] = edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
    }));

    const executionOrder = this.topologicalSort(dagNodes, dagEdges);

    return {
      nodes: dagNodes,
      edges: dagEdges,
      executionOrder,
    };
  }

  /**
   * 获取节点的输入边
   */
  private getNodeInputs(nodeId: string, edges: WorkflowEdge[]): string[] {
    return edges
      .filter(edge => edge.target === nodeId)
      .map(edge => edge.source);
  }

  /**
   * 获取节点的输出边
   */
  private getNodeOutputs(nodeId: string, edges: WorkflowEdge[]): string[] {
    return edges
      .filter(edge => edge.source === nodeId)
      .map(edge => edge.target);
  }

  /**
   * 拓扑排序 - 使用 Kahn 算法
   */
  private topologicalSort(nodes: DAGNode[], edges: DAGEdge[]): string[][] {
    const inDegree = new Map<string, number>();
    const levels: string[][] = [];
    
    // 初始化入度
    nodes.forEach(node => inDegree.set(node.id, 0));
    edges.forEach(edge => {
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    });

    // 找到所有入度为 0 的节点作为起始节点
    let currentLevel = nodes
      .filter(node => inDegree.get(node.id) === 0)
      .map(node => node.id);

    while (currentLevel.length > 0) {
      levels.push([...currentLevel]);
      const nextLevel: string[] = [];

      for (const nodeId of currentLevel) {
        // 找到所有从当前节点出发的边
        const outgoingEdges = edges.filter(edge => edge.source === nodeId);
        
        for (const edge of outgoingEdges) {
          const newDegree = (inDegree.get(edge.target) || 0) - 1;
          inDegree.set(edge.target, newDegree);
          
          if (newDegree === 0) {
            nextLevel.push(edge.target);
          }
        }
      }

      currentLevel = nextLevel;
    }

    return levels;
  }
}
