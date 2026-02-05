import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { cn } from '../../utils';
import { NodeStatusBadge, NodeStatus } from '../NodeStatusBadge';

export interface NodeWrapperProps {
  /** 节点 ID */
  nodeId: string;
  /** 子元素 */
  children: React.ReactNode;
  /** 节点执行状态 */
  executionStatus?: NodeStatus;
  /** 执行时长(ms) */
  executionDuration?: number;
  /** 是否被选中 */
  selected?: boolean;
  /** 节点颜色主题 */
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray';
}

/**
 * NodeWrapper - 节点包装器
 * 提供统一的节点样式和状态显示
 */
export const NodeWrapper: React.FC<NodeWrapperProps> = ({
  nodeId: _nodeId,
  children,
  executionStatus,
  executionDuration,
  selected,
  color = 'blue',
}) => {
  const colorClasses = {
    blue: 'border-blue-200 hover:border-blue-300',
    green: 'border-green-200 hover:border-green-300',
    purple: 'border-purple-200 hover:border-purple-300',
    orange: 'border-orange-200 hover:border-orange-300',
    red: 'border-red-200 hover:border-red-300',
    gray: 'border-gray-200 hover:border-gray-300',
  };

  const statusClasses = {
    pending: '',
    running: 'ring-2 ring-blue-400 ring-offset-2',
    completed: 'ring-2 ring-green-400 ring-offset-2',
    failed: 'ring-2 ring-red-400 ring-offset-2',
    skipped: 'opacity-60',
  };

  return (
    <div
      className={cn(
        'relative min-w-[180px] bg-white rounded-lg border-2 shadow-sm transition-all',
        colorClasses[color],
        selected && 'ring-2 ring-blue-500 ring-offset-2',
        executionStatus && statusClasses[executionStatus],
        'hover:shadow-md'
      )}
    >
      {/* 状态徽章 */}
      {executionStatus && executionStatus !== 'pending' && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <NodeStatusBadge 
            status={executionStatus} 
            duration={executionDuration}
          />
        </div>
      )}

      {/* 节点内容 */}
      <div className="p-4">
        {children}
      </div>

      {/* 输入连接点 */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className={cn(
          'w-3 h-3 !bg-white !border-2',
          executionStatus === 'running' && '!border-blue-500 !bg-blue-100',
          executionStatus === 'completed' && '!border-green-500 !bg-green-100',
          executionStatus === 'failed' && '!border-red-500 !bg-red-100'
        )}
      />
      
      {/* 输出连接点 */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className={cn(
          'w-3 h-3 !bg-white !border-2',
          executionStatus === 'running' && '!border-blue-500 !bg-blue-100',
          executionStatus === 'completed' && '!border-green-500 !bg-green-100',
          executionStatus === 'failed' && '!border-red-500 !bg-red-100'
        )}
      />
    </div>
  );
};

export default NodeWrapper;
