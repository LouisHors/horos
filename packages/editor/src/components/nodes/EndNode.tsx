import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Square } from 'lucide-react';

interface EndNodeData {
  label?: string;
  description?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const EndNode: React.FC<NodeProps<any>> = ({
  selected,
  data,
}) => {
  const nodeData = data as EndNodeData;
  
  return (
    <div
      className={`
        relative px-6 py-3 rounded-full border-2 
        bg-red-50 border-red-500 
        shadow-sm transition-all duration-200
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2 shadow-lg' : 'hover:shadow-md'}
      `}
    >
      {/* 输入连接点 */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-red-500 !border-2 !border-white"
        style={{ left: -6 }}
      />

      {/* 节点内容 */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
          <Square className="w-3 h-3 text-white fill-white" />
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900">
            {nodeData.label || 'End'}
          </div>
          {nodeData.description && (
            <div className="text-xs text-gray-500">{nodeData.description}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EndNode;
