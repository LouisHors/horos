import React from 'react';
import { Loader2, CheckCircle2, XCircle, SkipForward } from 'lucide-react';
import { cn } from '../utils';

export type NodeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface NodeStatusBadgeProps {
  /** 节点状态 */
  status: NodeStatus;
  /** 执行时间(ms) */
  duration?: number;
  /** 额外类名 */
  className?: string;
}

/**
 * NodeStatusBadge - 节点状态徽章
 */
export const NodeStatusBadge: React.FC<NodeStatusBadgeProps> = ({
  status,
  duration,
  className,
}) => {
  const config = {
    pending: {
      icon: null,
      className: 'bg-gray-100 text-gray-400',
      label: '等待',
    },
    running: {
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
      className: 'bg-blue-100 text-blue-600',
      label: '运行',
    },
    completed: {
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      className: 'bg-green-100 text-green-600',
      label: '完成',
    },
    failed: {
      icon: <XCircle className="w-3.5 h-3.5" />,
      className: 'bg-red-100 text-red-600',
      label: '失败',
    },
    skipped: {
      icon: <SkipForward className="w-3.5 h-3.5" />,
      className: 'bg-gray-100 text-gray-500',
      label: '跳过',
    },
  };

  const { icon, className: badgeClassName, label } = config[status];

  if (status === 'pending') return null;

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        badgeClassName,
        className
      )}
    >
      {icon}
      <span>{label}</span>
      {duration !== undefined && (
        <span className="opacity-75">({formatDuration(duration)})</span>
      )}
    </div>
  );
};

/**
 * 格式化执行时间
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export default NodeStatusBadge;
