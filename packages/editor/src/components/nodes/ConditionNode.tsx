import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { GitBranch, Settings } from 'lucide-react';

interface ConditionBranch {
  label: string;
  condition: string;
}

interface ConditionNodeData {
  label?: string;
  condition?: string;
  branches?: ConditionBranch[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ConditionNode: React.FC<NodeProps<any>> = ({
  selected,
  data,
}) => {
  const nodeData = data as ConditionNodeData;
  const branches = nodeData.branches || [
    { label: 'True', condition: 'true' },
    { label: 'False', condition: 'false' },
  ];

  return (
    <div
      className={`
        relative w-64 rounded-lg border-2 
        bg-white border-amber-500 
        shadow-sm transition-all duration-200
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2 shadow-lg' : 'hover:shadow-md'}
      `}
    >
      {/* 输入连接点 */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white"
        style={{ left: -6, top: 28 }}
      />

      {/* 头部 */}
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-t-md border-b border-amber-100">
        <div className="w-6 h-6 rounded-md bg-amber-500 flex items-center justify-center">
          <GitBranch className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {nodeData.label || 'Condition'}
          </div>
        </div>
        {selected && (
          <Settings className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer" />
        )}
      </div>

      {/* 条件表达式 */}
      {nodeData.condition && (
        <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
          <code className="text-xs text-gray-700 font-mono">{nodeData.condition}</code>
        </div>
      )}

      {/* 分支输出 */}
      <div className="py-1">
        {branches.map((branch, index) => (
          <div
            key={index}
            className="relative flex items-center justify-between px-3 py-1.5 hover:bg-gray-50"
          >
            <span className="text-xs font-medium text-gray-700">
              {branch.label}
            </span>
            {/* 分支输出连接点 */}
            <Handle
              type="source"
              position={Position.Right}
              id={`branch-${index}`}
              className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white"
              style={{ right: -6 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConditionNode;
