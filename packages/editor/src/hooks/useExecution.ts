import { useState, useCallback, useRef, useEffect } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { NodeData } from '../types';

export type ExecutionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed';

export interface NodeExecutionState {
  nodeId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  output?: unknown;
  error?: Error;
  startTime?: Date;
  endTime?: Date;
}

export interface ExecutionResult {
  success: boolean;
  executionId: string;
  status: string;
  outputs: Record<string, unknown>;
  errors: Array<{ nodeId: string; error: string; recoverable: boolean }>;
  duration: number;
}

export interface UseExecutionReturn {
  /** 当前执行状态 */
  status: ExecutionStatus;
  /** 是否正在运行 */
  isRunning: boolean;
  /** 节点执行状态映射 */
  nodeStates: Map<string, NodeExecutionState>;
  /** 当前执行的节点 ID */
  currentNodeId: string | null;
  /** 执行结果 */
  result: ExecutionResult | null;
  /** 错误信息 */
  error: Error | null;
  /** 启动执行 */
  start: (nodes: Node<NodeData>[], edges: Edge[]) => Promise<void>;
  /** 暂停执行 */
  pause: () => void;
  /** 恢复执行 */
  resume: () => void;
  /** 停止执行 */
  stop: () => void;
  /** 重置状态 */
  reset: () => void;
  /** 获取节点状态 */
  getNodeState: (nodeId: string) => NodeExecutionState | undefined;
}

/**
 * useExecution Hook - 管理工作流执行状态
 * 通过 API 调用服务端执行引擎
 */
export function useExecution(): UseExecutionReturn {
  const [status, setStatus] = useState<ExecutionStatus>('idle');
  const [nodeStates, setNodeStates] = useState<Map<string, NodeExecutionState>>(new Map());
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // 模拟节点执行进度（因为服务端执行是原子的，这里用模拟进度展示）
  const simulateProgress = useCallback((nodes: Node<NodeData>[]) => {
    console.log('[useExecution] 🎬 开始模拟执行进度');
    
    nodes.forEach((node, index) => {
      setTimeout(() => {
        // 节点开始
        setCurrentNodeId(node.id);
        setNodeStates(prev => {
          const next = new Map(prev);
          next.set(node.id, {
            nodeId: node.id,
            status: 'running',
            startTime: new Date(),
          });
          return next;
        });
        
        // 节点完成（假设500ms后）
        setTimeout(() => {
          setNodeStates(prev => {
            const next = new Map(prev);
            const current = next.get(node.id);
            next.set(node.id, {
              nodeId: node.id,
              status: 'completed',
              startTime: current?.startTime,
              endTime: new Date(),
            });
            return next;
          });
        }, 500);
        
      }, index * 600); // 每个节点间隔600ms
    });
  }, []);

  const start = useCallback(async (nodes: Node<NodeData>[], edges: Edge[]) => {
    console.log('[useExecution] 🚀 start()', { nodeCount: nodes.length, edgeCount: edges.length });
    
    setError(null);
    setResult(null);
    setNodeStates(new Map());
    setStatus('running');
    
    // 创建 abort controller 用于取消
    abortControllerRef.current = new AbortController();
    
    try {
      // 模拟节点执行进度（用于UI展示）
      simulateProgress(nodes);
      
      // 调用 API 执行工作流
      console.log('[useExecution] 📡 调用 API /api/execute...');
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nodes, edges }),
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      const data: ExecutionResult = await response.json();
      console.log('[useExecution] ✅ API 响应:', data);
      
      setResult(data);
      setStatus(data.success ? 'completed' : 'failed');
      setCurrentNodeId(null);
      
      // 更新所有节点为完成状态（根据实际结果）
      setNodeStates(prev => {
        const next = new Map(prev);
        nodes.forEach(node => {
          const existing = next.get(node.id);
          next.set(node.id, {
            nodeId: node.id,
            status: data.success ? 'completed' : 'failed',
            startTime: existing?.startTime,
            endTime: new Date(),
          });
        });
        return next;
      });
      
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        console.log('[useExecution] ⏹️ 执行被取消');
        setStatus('idle');
      } else {
        console.error('[useExecution] ❌ 执行失败:', err);
        setError(err as Error);
        setStatus('failed');
      }
      setCurrentNodeId(null);
    }
  }, [simulateProgress]);

  const pause = useCallback(() => {
    console.log('[useExecution] ⏸️ pause() - 暂不支持');
    // API 执行是原子的，暂不支持暂停
  }, []);

  const resume = useCallback(() => {
    console.log('[useExecution] ▶️ resume() - 暂不支持');
    // API 执行是原子的，暂不支持恢复
  }, []);

  const stop = useCallback(() => {
    console.log('[useExecution] 🛑 stop()');
    abortControllerRef.current?.abort();
    setCurrentNodeId(null);
    setStatus('idle');
  }, []);

  const reset = useCallback(() => {
    console.log('[useExecution] 🔄 reset()');
    abortControllerRef.current?.abort();
    setStatus('idle');
    setNodeStates(new Map());
    setCurrentNodeId(null);
    setResult(null);
    setError(null);
  }, []);

  const getNodeState = useCallback((nodeId: string) => {
    return nodeStates.get(nodeId);
  }, [nodeStates]);

  // 清理
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    status,
    isRunning: status === 'running',
    nodeStates,
    currentNodeId,
    result,
    error,
    start,
    pause,
    resume,
    stop,
    reset,
    getNodeState,
  };
}
