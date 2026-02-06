import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

function EndNodeComponent({ data }: NodeProps) {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-red-500 min-w-[150px]">
      <Handle type="target" position={Position.Top} className="!bg-red-500" />
      
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-full bg-red-500 mr-2" />
        <div className="font-medium text-gray-700">{data.label as string}</div>
      </div>
    </div>
  );
}

export const EndNode = memo(EndNodeComponent);
