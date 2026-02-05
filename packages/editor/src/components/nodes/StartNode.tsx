import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Play } from 'lucide-react';

interface StartNodeData {
  label?: string;
  description?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const StartNode: React.FC<NodeProps<any>> = ({
  selected,
  data,
}) => {
  const nodeData = data as StartNodeData;
  
  return (
    <div
      className={`
        relative px-6 py-3 rounded-full border-2 
        bg-green-50 border-green-500 
        shadow-sm transition-all duration-200
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2 shadow-lg' : 'hover:shadow-md'}
      `}
    >
      {/* 输出连接点 */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-white"
        style={{ right: -6 }}
      />

      {/* 节点内容 */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
          <Play className="w-3 h-3 text-white fill-white" />
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900">
            {nodeData.label || 'Start'}
          </div>
          {nodeData.description && (
            <div className="text-xs text-gray-500">{nodeData.description}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StartNode;
