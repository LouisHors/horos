import { useState, useCallback, useEffect } from 'react';

export interface ExecutionRecord {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  nodeCount: number;
  result?: {
    success: boolean;
    outputs: Record<string, unknown>;
  };
  error?: string;
}

export interface UseExecutionHistoryReturn {
  records: ExecutionRecord[];
  addRecord: (record: Omit<ExecutionRecord, 'id'>) => string;
  updateRecord: (id: string, updates: Partial<ExecutionRecord>) => void;
  deleteRecord: (id: string) => void;
  getRecord: (id: string) => ExecutionRecord | undefined;
  clearHistory: () => void;
}

const STORAGE_KEY = 'horos_execution_history';

/**
 * useExecutionHistory - 执行历史管理
 * 使用 localStorage 持久化
 */
export function useExecutionHistory(): UseExecutionHistoryReturn {
  const [records, setRecords] = useState<ExecutionRecord[]>([]);

  // 从 localStorage 加载
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecords(parsed.map((r: any) => ({
          ...r,
          startTime: new Date(r.startTime),
          endTime: r.endTime ? new Date(r.endTime) : undefined,
        })));
      } catch {
        console.error('Failed to load execution history');
      }
    }
  }, []);

  // 保存到 localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  const addRecord = useCallback((record: Omit<ExecutionRecord, 'id'>) => {
    const id = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newRecord: ExecutionRecord = {
      ...record,
      id,
    };
    setRecords(prev => [newRecord, ...prev]);
    return id;
  }, []);

  const updateRecord = useCallback((id: string, updates: Partial<ExecutionRecord>) => {
    setRecords(prev =>
      prev.map(r => (r.id === id ? { ...r, ...updates } : r))
    );
  }, []);

  const deleteRecord = useCallback((id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
  }, []);

  const getRecord = useCallback((id: string) => {
    return records.find(r => r.id === id);
  }, [records]);

  const clearHistory = useCallback(() => {
    setRecords([]);
  }, []);

  return {
    records,
    addRecord,
    updateRecord,
    deleteRecord,
    getRecord,
    clearHistory,
  };
}
