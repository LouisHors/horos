import React from 'react';
import { Clock, CheckCircle2, XCircle, Loader2, Trash2 } from 'lucide-react';
import { cn } from '../../utils';
import type { ExecutionRecord } from '../../hooks/useExecutionHistory';

export interface ExecutionHistoryPanelProps {
  records: ExecutionRecord[];
  onSelect?: (record: ExecutionRecord) => void;
  onDelete?: (id: string) => void;
  onClear?: () => void;
  className?: string;
}

/**
 * ExecutionHistoryPanel - 执行历史面板
 */
export const ExecutionHistoryPanel: React.FC<ExecutionHistoryPanelProps> = ({
  records,
  onSelect,
  onDelete,
  onClear,
  className,
}) => {
  const getStatusIcon = (status: ExecutionRecord['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusClass = (status: ExecutionRecord['status']) => {
    switch (status) {
      case 'running':
        return 'bg-blue-50 border-blue-200';
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'cancelled':
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className={cn('bg-white rounded-lg border shadow-sm', className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-medium text-gray-900">执行历史</h3>
        {records.length > 0 && onClear && (
          <button
            onClick={onClear}
            className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            清空
          </button>
        )}
      </div>

      <div className="max-h-[400px] overflow-auto">
        {records.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">暂无执行记录</p>
          </div>
        ) : (
          <div className="divide-y">
            {records.map((record) => (
              <div
                key={record.id}
                onClick={() => onSelect?.(record)}
                className={cn(
                  'p-3 cursor-pointer hover:bg-gray-50 transition-colors',
                  onSelect && 'cursor-pointer'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(record.status)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {record.workflowName || '未命名工作流'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(record.startTime)} · {record.nodeCount} 节点
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {formatDuration(record.duration)}
                    </span>
                    {onDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(record.id);
                        }}
                        className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutionHistoryPanel;
