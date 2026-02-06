import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

function StartNodeComponent({ data }: NodeProps) {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-green-500 min-w-[150px]">
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
        <div className="font-medium text-gray-700">{data.label as string}</div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-green-500" />
    </div>
  );
}

export const StartNode = memo(StartNodeComponent);
