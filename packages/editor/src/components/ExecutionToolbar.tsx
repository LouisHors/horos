import React from 'react';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';
import { cn } from '../utils';
import { ExecutionStatus } from '../integrations/ExecutionBridge';

export interface ExecutionToolbarProps {
  /** 当前执行状态 */
  status: ExecutionStatus;
  /** 是否可以运行 */
  canRun?: boolean;
  /** 启动执行 */
  onRun: () => void;
  /** 暂停执行 */
  onPause: () => void;
  /** 恢复执行 */
  onResume: () => void;
  /** 停止执行 */
  onStop: () => void;
  /** 重置 */
  onReset: () => void;
  /** 额外类名 */
  className?: string;
}

/**
 * ExecutionToolbar - 执行控制工具栏
 */
export const ExecutionToolbar: React.FC<ExecutionToolbarProps> = ({
  status,
  canRun = true,
  onRun,
  onPause,
  onResume,
  onStop,
  onReset,
  className,
}) => {
  const isIdle = status === 'idle';
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isCompleted = status === 'completed' || status === 'failed';

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-2 bg-white border rounded-lg shadow-sm',
        className
      )}
    >
      {/* 状态指示器 */}
      <div className="flex items-center gap-2 mr-4">
        <div
          className={cn(
            'w-3 h-3 rounded-full',
            isIdle && 'bg-gray-400',
            isRunning && 'bg-green-500 animate-pulse',
            isPaused && 'bg-yellow-500',
            status === 'completed' && 'bg-blue-500',
            status === 'failed' && 'bg-red-500'
          )}
        />
        <span className="text-sm font-medium text-gray-700">
          {isIdle && '就绪'}
          {isRunning && '运行中'}
          {isPaused && '已暂停'}
          {status === 'completed' && '已完成'}
          {status === 'failed' && '失败'}
        </span>
      </div>

      <div className="w-px h-6 bg-gray-300" />

      {/* 控制按钮 */}
      {isIdle && (
        <button
          onClick={onRun}
          disabled={!canRun}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            canRun
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          )}
        >
          <Play className="w-4 h-4" />
          运行
        </button>
      )}

      {isRunning && (
        <button
          onClick={onPause}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
        >
          <Pause className="w-4 h-4" />
          暂停
        </button>
      )}

      {isPaused && (
        <button
          onClick={onResume}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
        >
          <Play className="w-4 h-4" />
          恢复
        </button>
      )}

      {(isRunning || isPaused) && (
        <button
          onClick={onStop}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
        >
          <Square className="w-4 h-4" />
          停止
        </button>
      )}

      {isCompleted && (
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-gray-600 text-white hover:bg-gray-700 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          重置
        </button>
      )}
    </div>
  );
};

export default ExecutionToolbar;
