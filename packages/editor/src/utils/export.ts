import { WorkflowNode, WorkflowEdge, FlowDefinition } from '../types';

// 导出格式
export type ExportFormat = 'json' | 'yaml';

// 导出选项
export interface ExportOptions {
  format?: ExportFormat;
  includeExecutionState?: boolean;
  includeMetadata?: boolean;
  pretty?: boolean;
}

// 导入选项
export interface ImportOptions {
  format?: ExportFormat;
  validate?: boolean;
}

/**
 * 导出工作流为 JSON
 */
export function exportToJSON(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  metadata?: Partial<FlowDefinition>,
  options: ExportOptions = {}
): string {
  const { includeExecutionState = false, includeMetadata = true, pretty = true } = options;
  
  const data: Record<string, unknown> = {
    id: metadata?.id || `flow_${Date.now()}`,
    name: metadata?.name || 'Untitled Workflow',
    description: metadata?.description || '',
    nodes: includeExecutionState ? nodes : sanitizeNodes(nodes),
    edges: includeExecutionState ? edges : sanitizeEdges(edges),
    createdAt: metadata?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  if (includeMetadata) {
    data._exportInfo = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tool: 'AI Agent Visual Editor',
    };
  }
  
  return JSON.stringify(data, null, pretty ? 2 : undefined);
}

/**
 * 导出工作流为 YAML
 */
export function exportToYAML(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  metadata?: Partial<FlowDefinition>,
  options: ExportOptions = {}
): string {
  const json = exportToJSON(nodes, edges, metadata, options);
  const data = JSON.parse(json);
  
  // 简单的 YAML 序列化
  return convertToYAML(data);
}

/**
 * 简单的 YAML 转换器
 */
function convertToYAML(obj: unknown, indent: number = 0): string {
  const spaces = '  '.repeat(indent);
  
  if (obj === null) return 'null';
  if (typeof obj === 'boolean') return obj ? 'true' : 'false';
  if (typeof obj === 'number') return String(obj);
  if (typeof obj === 'string') {
    // 需要引号的情况
    if (/[:\[\]{}#,@!&*?|\-'"%]/.test(obj) || obj.includes('\n')) {
      return `"${obj.replace(/"/g, '\\"')}"`;
    }
    return obj;
  }
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return obj
      .map(item => `${spaces}- ${convertToYAML(item, indent + 1).trimStart()}`)
      .join('\n');
  }
  
  if (typeof obj === 'object') {
    const entries = Object.entries(obj as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    
    return entries
      .map(([key, value]) => {
        const yamlValue = convertToYAML(value, indent + 1);
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          return `${spaces}${key}:\n${yamlValue}`;
        }
        return `${spaces}${key}: ${yamlValue}`;
      })
      .join('\n');
  }
  
  return String(obj);
}

/**
 * 从 JSON 导入
 */
export function importFromJSON(
  json: string,
  _options: ImportOptions = {}
): { nodes: WorkflowNode[]; edges: WorkflowEdge[]; metadata: Partial<FlowDefinition> } | null {
  try {
    const data = JSON.parse(json);
    
    if (!data.nodes || !Array.isArray(data.nodes)) {
      throw new Error('Invalid format: missing nodes');
    }
    
    if (!data.edges || !Array.isArray(data.edges)) {
      throw new Error('Invalid format: missing edges');
    }
    
    const metadata: Partial<FlowDefinition> = {
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
    
    return {
      nodes: data.nodes,
      edges: data.edges,
      metadata,
    };
  } catch (error) {
    console.error('Failed to import JSON:', error);
    return null;
  }
}

/**
 * 从 YAML 导入
 */
export function importFromYAML(
  yaml: string,
  options: ImportOptions = {}
): { nodes: WorkflowNode[]; edges: WorkflowEdge[]; metadata: Partial<FlowDefinition> } | null {
  try {
    // 简单的 YAML 解析（转换为 JSON）
    const data = parseYAML(yaml);
    return importFromJSON(JSON.stringify(data), options);
  } catch (error) {
    console.error('Failed to import YAML:', error);
    return null;
  }
}

/**
 * 简单的 YAML 解析器
 */
function parseYAML(yaml: string): unknown {
  const lines = yaml.split('\n');
  const stack: { obj: Record<string, unknown> | unknown[]; isArray: boolean }[] = [];
  let current: Record<string, unknown> = {};
  
  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    
    const indent = line.search(/\S/);
    const content = line.trim();
    
    // 处理数组项
    if (content.startsWith('- ')) {
      const value = content.slice(2).trim();
      
      // 找到正确的数组层级
      while (stack.length > 0 && indent <= (stack.length - 1) * 2) {
        stack.pop();
      }
      
      if (stack.length > 0) {
        const parent = stack[stack.length - 1];
        if (parent.isArray) {
          (parent.obj as unknown[]).push(parseYAMLValue(value));
        }
      }
      continue;
    }
    
    // 处理键值对
    const colonIndex = content.indexOf(':');
    if (colonIndex === -1) continue;
    
    const key = content.slice(0, colonIndex).trim();
    let value = content.slice(colonIndex + 1).trim();
    
    // 处理嵌套对象
    if (!value) {
      const newObj: Record<string, unknown> = {};
      current[key] = newObj;
      stack.push({ obj: newObj, isArray: false });
      current = newObj;
    } else {
      current[key] = parseYAMLValue(value);
    }
  }
  
  return current;
}

/**
 * 解析 YAML 值
 */
function parseYAMLValue(value: string): unknown {
  value = value.trim();
  
  // 布尔值
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null' || value === '~') return null;
  
  // 数字
  if (/^-?\d+$/.test(value)) return parseInt(value, 10);
  if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);
  
  // 字符串（去除引号）
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1).replace(/\\"/g, '"');
  }
  
  // 数组
  if (value.startsWith('[') && value.endsWith(']')) {
    return value.slice(1, -1).split(',').map(v => parseYAMLValue(v.trim()));
  }
  
  return value;
}

/**
 * 清理节点数据（移除执行状态）
 */
function sanitizeNodes(nodes: WorkflowNode[]): WorkflowNode[] {
  return nodes.map(node => ({
    ...node,
    data: sanitizeNodeData(node.data),
  })) as WorkflowNode[];
}

/**
 * 清理边数据
 */
function sanitizeEdges(edges: WorkflowEdge[]): WorkflowEdge[] {
  return edges.map(edge => ({
    ...edge,
    data: edge.data ? sanitizeNodeData(edge.data) : undefined,
  }));
}

/**
 * 清理节点数据
 */
function sanitizeNodeData(data: Record<string, unknown>): Record<string, unknown> {
  const clean = { ...data };
  // 移除执行相关字段
  delete clean.executionStatus;
  delete clean.executionResult;
  delete clean.executionError;
  delete clean.startedAt;
  delete clean.completedAt;
  delete clean.duration;
  return clean;
}

/**
 * 下载文件
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  if (typeof window === 'undefined') return;
  
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 读取文件内容
 */
export function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}

/**
 * 自动检测格式并导入
 */
export async function importFlow(
  content: string,
  options: ImportOptions = {}
): Promise<{ nodes: WorkflowNode[]; edges: WorkflowEdge[]; metadata: Partial<FlowDefinition> } | null> {
  const trimmed = content.trim();
  
  // 检测格式
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return importFromJSON(trimmed, options);
  }
  
  if (trimmed.includes(':')) {
    return importFromYAML(trimmed, options);
  }
  
  return null;
}

export default {
  exportToJSON,
  exportToYAML,
  importFromJSON,
  importFromYAML,
  importFlow,
  downloadFile,
  readFile,
};
