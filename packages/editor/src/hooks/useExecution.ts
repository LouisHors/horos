import { useState, useCallback, useRef, useEffect } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { ExecutionBridge, ExecutionStatus, NodeExecutionState } from '../integrations/ExecutionBridge';
import { NodeData } from '../types';

// 本地定义 ExecutionResult 类型以避免直接依赖
interface ExecutionResult {
  success: boolean;
  executionId: string;
  status: string;
  outputs: Map<string, unknown>;
  errors: Array<{ nodeId: string; error: Error; recoverable: boolean }>;
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
 */
export function useExecution(): UseExecutionReturn {
  const [status, setStatus] = useState<ExecutionStatus>('idle');
  const [nodeStates, setNodeStates] = useState<Map<string, NodeExecutionState>>(new Map());
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  const bridgeRef = useRef<ExecutionBridge | null>(null);

  // 初始化 ExecutionBridge
  useEffect(() => {
    bridgeRef.current = new ExecutionBridge({
      onNodeStart: (nodeId) => {
        setCurrentNodeId(nodeId);
        setNodeStates(prev => {
          const next = new Map(prev);
          next.set(nodeId, {
            nodeId,
            status: 'running',
            startTime: new Date(),
          });
          return next;
        });
      },
      onNodeComplete: (nodeId, output) => {
        setNodeStates(prev => {
          const next = new Map(prev);
          const current = next.get(nodeId);
          next.set(nodeId, {
            nodeId,
            status: 'completed',
            output,
            startTime: current?.startTime,
            endTime: new Date(),
          });
          return next;
        });
      },
      onNodeError: (nodeId, err) => {
        setNodeStates(prev => {
          const next = new Map(prev);
          const current = next.get(nodeId);
          next.set(nodeId, {
            nodeId,
            status: 'failed',
            error: err,
            startTime: current?.startTime,
            endTime: new Date(),
          });
          return next;
        });
      },
      onExecutionComplete: (execResult) => {
        setResult(execResult);
        setCurrentNodeId(null);
      },
      onExecutionError: (err) => {
        setError(err);
        setCurrentNodeId(null);
      },
      onStatusChange: (newStatus) => {
        setStatus(newStatus);
      },
    });

    return () => {
      bridgeRef.current?.stop();
      bridgeRef.current = null;
    };
  }, []);

  const start = useCallback(async (nodes: Node<NodeData>[], edges: Edge[]) => {
    setError(null);
    setResult(null);
    setNodeStates(new Map());
    
    try {
      await bridgeRef.current?.start(nodes, edges);
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  const pause = useCallback(() => {
    bridgeRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    bridgeRef.current?.resume();
  }, []);

  const stop = useCallback(() => {
    bridgeRef.current?.stop();
    setCurrentNodeId(null);
  }, []);

  const reset = useCallback(() => {
    bridgeRef.current?.reset();
    setStatus('idle');
    setNodeStates(new Map());
    setCurrentNodeId(null);
    setResult(null);
    setError(null);
  }, []);

  const getNodeState = useCallback((nodeId: string) => {
    return nodeStates.get(nodeId);
  }, [nodeStates]);

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
