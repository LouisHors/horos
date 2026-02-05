import { WorkflowNode, WorkflowEdge } from '../types';

// 剪贴板数据格式
export interface ClipboardData {
  version: string;
  timestamp: number;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  sourceWorkflowId?: string;
}

// 粘贴位置偏移
export interface PasteOffset {
  x: number;
  y: number;
}

// 序列化选项
export interface SerializeOptions {
  includeExecutionState?: boolean;
}

/**
 * 剪贴板管理器 - 负责复制/粘贴功能
 */
export class ClipboardManager {
  private clipboardData: ClipboardData | null = null;
  private pasteCount: number = 0;
  
  /**
   * 复制节点和边到剪贴板
   */
  copy(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    sourceWorkflowId?: string
  ): ClipboardData {
    // 深拷贝节点和边
    const nodesCopy = this.cloneNodes(nodes);
    const edgesCopy = this.cloneEdges(edges);
    
    this.clipboardData = {
      version: '1.0',
      timestamp: Date.now(),
      nodes: nodesCopy,
      edges: edgesCopy,
      sourceWorkflowId,
    };
    
    this.pasteCount = 0;
    return this.clipboardData;
  }
  
  /**
   * 剪切节点（复制后清空原数据）
   */
  cut(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    sourceWorkflowId?: string
  ): ClipboardData {
    return this.copy(nodes, edges, sourceWorkflowId);
  }
  
  /**
   * 从剪贴板粘贴
   * @param offset 位置偏移量，每次粘贴会累加
   * @returns 粘贴的节点和边（已生成新ID）
   */
  paste(offset: PasteOffset = { x: 50, y: 50 }): ClipboardData | null {
    if (!this.clipboardData) {
      return null;
    }
    
    this.pasteCount++;
    
    // 生成 ID 映射表
    const idMap = this.createIdMap(this.clipboardData.nodes);
    
    // 生成新的节点和边
    const newNodes = this.createNewNodes(this.clipboardData.nodes, idMap, offset);
    const newEdges = this.createNewEdges(this.clipboardData.edges, idMap);
    
    return {
      ...this.clipboardData,
      nodes: newNodes,
      edges: newEdges,
    };
  }
  
  /**
   * 检查剪贴板是否有数据
   */
  hasData(): boolean {
    return this.clipboardData !== null;
  }
  
  /**
   * 获取剪贴板数据（不修改）
   */
  getData(): ClipboardData | null {
    return this.clipboardData;
  }
  
  /**
   * 清空剪贴板
   */
  clear(): void {
    this.clipboardData = null;
    this.pasteCount = 0;
  }
  
  /**
   * 序列化为 JSON 字符串
   */
  serialize(data: ClipboardData, options: SerializeOptions = {}): string {
    const exportData = {
      ...data,
      _exportInfo: {
        version: '1.0',
        exportedAt: new Date().toISOString(),
      },
    };
    
    if (!options.includeExecutionState) {
      // 移除执行状态
      (exportData as any).nodes = exportData.nodes.map(node => ({
        ...node,
        data: this.sanitizeNodeData(node.data),
      }));
    }
    
    return JSON.stringify(exportData, null, 2);
  }
  
  /**
   * 从 JSON 字符串反序列化
   */
  deserialize(json: string): ClipboardData | null {
    try {
      const data = JSON.parse(json);
      
      // 验证格式
      if (!data.nodes || !Array.isArray(data.nodes)) {
        throw new Error('Invalid clipboard data: missing nodes');
      }
      
      if (!data.edges || !Array.isArray(data.edges)) {
        throw new Error('Invalid clipboard data: missing edges');
      }
      
      this.clipboardData = {
        version: data.version || '1.0',
        timestamp: data.timestamp || Date.now(),
        nodes: data.nodes,
        edges: data.edges,
        sourceWorkflowId: data.sourceWorkflowId,
      };
      
      this.pasteCount = 0;
      return this.clipboardData;
    } catch (error) {
      console.error('Failed to deserialize clipboard data:', error);
      return null;
    }
  }
  
  /**
   * 导出到文件
   */
  exportToFile(data: ClipboardData, filename?: string): string {
    const json = this.serialize(data);
    const blob = new Blob([json], { type: 'application/json' });
    
    // 在浏览器环境中创建下载链接
    if (typeof window !== 'undefined') {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `workflow-nodes-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    
    return json;
  }
  
  /**
   * 从文件导入
   */
  async importFromFile(file: File): Promise<ClipboardData | null> {
    try {
      const text = await file.text();
      return this.deserialize(text);
    } catch (error) {
      console.error('Failed to import from file:', error);
      return null;
    }
  }
  
  /**
   * 复制到系统剪贴板（浏览器环境）
   */
  async copyToSystemClipboard(data: ClipboardData): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      return false;
    }
    
    try {
      const json = this.serialize(data);
      await navigator.clipboard.writeText(json);
      return true;
    } catch (error) {
      console.error('Failed to copy to system clipboard:', error);
      return false;
    }
  }
  
  /**
   * 从系统剪贴板粘贴（浏览器环境）
   */
  async pasteFromSystemClipboard(): Promise<ClipboardData | null> {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      return null;
    }
    
    try {
      const text = await navigator.clipboard.readText();
      return this.deserialize(text);
    } catch (error) {
      console.error('Failed to paste from system clipboard:', error);
      return null;
    }
  }
  
  // ===== 私有方法 =====
  
  /**
   * 深拷贝节点
   */
  private cloneNodes(nodes: WorkflowNode[]): WorkflowNode[] {
    return nodes.map(node => ({
      ...node,
      data: { ...node.data },
      position: { ...node.position },
    }));
  }
  
  /**
   * 深拷贝边
   */
  private cloneEdges(edges: WorkflowEdge[]): WorkflowEdge[] {
    return edges.map(edge => ({
      ...edge,
    }));
  }
  
  /**
   * 创建 ID 映射表
   */
  private createIdMap(nodes: WorkflowNode[]): Map<string, string> {
    const map = new Map<string, string>();
    
    nodes.forEach(node => {
      map.set(node.id, this.generateId());
    });
    
    return map;
  }
  
  /**
   * 生成新 ID
   */
  private generateId(): string {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * 创建新节点（使用新ID）
   */
  private createNewNodes(
    nodes: WorkflowNode[],
    idMap: Map<string, string>,
    offset: PasteOffset
  ): WorkflowNode[] {
    const offsetX = offset.x * this.pasteCount;
    const offsetY = offset.y * this.pasteCount;
    
    return nodes.map(node => ({
      ...node,
      id: idMap.get(node.id) || this.generateId(),
      position: {
        x: node.position.x + offsetX,
        y: node.position.y + offsetY,
      },
      data: { ...node.data },
      selected: false,
    }));
  }
  
  /**
   * 创建新边（使用新节点ID）
   */
  private createNewEdges(edges: WorkflowEdge[], idMap: Map<string, string>): WorkflowEdge[] {
    return edges.map(edge => ({
      ...edge,
      id: `e-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: idMap.get(edge.source) || edge.source,
      target: idMap.get(edge.target) || edge.target,
    }));
  }
  
  /**
   * 清理节点数据（移除执行状态）
   */
  private sanitizeNodeData(data: Record<string, unknown>): Record<string, unknown> {
    const clean = { ...data };
    // 移除执行相关字段
    delete clean.executionStatus;
    delete clean.executionResult;
    delete clean.executionError;
    delete clean.startedAt;
    delete clean.completedAt;
    return clean;
  }
}

export default ClipboardManager;
