import { useCallback, useRef, useState } from 'react';
import { ClipboardManager, ClipboardData, PasteOffset } from '../core/ClipboardManager';
import { WorkflowNode, WorkflowEdge } from '../types';

export interface UseClipboardOptions {
  onPaste?: (data: ClipboardData) => void;
}

export interface UseClipboardReturn {
  // 状态
  hasData: boolean;
  data: ClipboardData | null;
  
  // 操作
  copy: (nodes: WorkflowNode[], edges: WorkflowEdge[], sourceWorkflowId?: string) => ClipboardData;
  cut: (nodes: WorkflowNode[], edges: WorkflowEdge[], sourceWorkflowId?: string) => ClipboardData;
  paste: (offset?: PasteOffset) => ClipboardData | null;
  clear: () => void;
  
  // 导入/导出
  exportToFile: (filename?: string) => string | null;
  importFromFile: (file: File) => Promise<ClipboardData | null>;
  serialize: () => string | null;
  deserialize: (json: string) => ClipboardData | null;
  
  // 系统剪贴板
  copyToSystem: () => Promise<boolean>;
  pasteFromSystem: () => Promise<ClipboardData | null>;
}

/**
 * 剪贴板管理 Hook - 提供复制/粘贴功能
 */
export function useClipboard(options: UseClipboardOptions = {}): UseClipboardReturn {
  const managerRef = useRef(new ClipboardManager());
  const [, setVersion] = useState(0);
  
  const forceUpdate = useCallback(() => {
    setVersion(v => v + 1);
  }, []);
  
  /**
   * 复制
   */
  const copy = useCallback((
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    sourceWorkflowId?: string
  ) => {
    const data = managerRef.current.copy(nodes, edges, sourceWorkflowId);
    forceUpdate();
    return data;
  }, [forceUpdate]);
  
  /**
   * 剪切
   */
  const cut = useCallback((
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    sourceWorkflowId?: string
  ) => {
    const data = managerRef.current.cut(nodes, edges, sourceWorkflowId);
    forceUpdate();
    return data;
  }, [forceUpdate]);
  
  /**
   * 粘贴
   */
  const paste = useCallback((offset?: PasteOffset) => {
    const data = managerRef.current.paste(offset);
    if (data) {
      options.onPaste?.(data);
      forceUpdate();
    }
    return data;
  }, [forceUpdate, options]);
  
  /**
   * 清除
   */
  const clear = useCallback(() => {
    managerRef.current.clear();
    forceUpdate();
  }, [forceUpdate]);
  
  /**
   * 导出到文件
   */
  const exportToFile = useCallback((filename?: string) => {
    const data = managerRef.current.getData();
    if (!data) return null;
    return managerRef.current.exportToFile(data, filename);
  }, []);
  
  /**
   * 从文件导入
   */
  const importFromFile = useCallback(async (file: File) => {
    const data = await managerRef.current.importFromFile(file);
    if (data) {
      forceUpdate();
    }
    return data;
  }, [forceUpdate]);
  
  /**
   * 序列化
   */
  const serialize = useCallback(() => {
    const data = managerRef.current.getData();
    if (!data) return null;
    return managerRef.current.serialize(data);
  }, []);
  
  /**
   * 反序列化
   */
  const deserialize = useCallback((json: string) => {
    const data = managerRef.current.deserialize(json);
    if (data) {
      forceUpdate();
    }
    return data;
  }, [forceUpdate]);
  
  /**
   * 复制到系统剪贴板
   */
  const copyToSystem = useCallback(async () => {
    const data = managerRef.current.getData();
    if (!data) return false;
    return managerRef.current.copyToSystemClipboard(data);
  }, []);
  
  /**
   * 从系统剪贴板粘贴
   */
  const pasteFromSystem = useCallback(async () => {
    const data = await managerRef.current.pasteFromSystemClipboard();
    if (data) {
      forceUpdate();
      options.onPaste?.(data);
    }
    return data;
  }, [forceUpdate, options]);
  
  const manager = managerRef.current;
  
  return {
    hasData: manager.hasData(),
    data: manager.getData(),
    copy,
    cut,
    paste,
    clear,
    exportToFile,
    importFromFile,
    serialize,
    deserialize,
    copyToSystem,
    pasteFromSystem,
  };
}

export default useClipboard;
