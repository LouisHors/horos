'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface AgentNodeData {
  label: string;
  model?: string;
  systemPrompt?: string;
  executionStatus?: 'pending' | 'running' | 'completed' | 'failed';
}

function AgentNodeComponent({ data }: NodeProps<AgentNodeData>) {
  const status = data.executionStatus;

  return (
    <div className={`px-4 py-3 shadow-md rounded-md bg-white border-2 min-w-[180px] transition-all ${
      status === 'running' ? 'border-blue-500 ring-2 ring-blue-200' :
      status === 'completed' ? 'border-green-500' :
      status === 'failed' ? 'border-red-500' :
      'border-blue-300'
    }`}>
      <Handle type="target" position={Position.Top} className="!bg-blue-500" />
      
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
          <div className="font-medium text-gray-700">{data.label}</div>
        </div>
        
        {status === 'running' && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
        {status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
        {status === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
      </div>
      
      {data.model && (
        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {data.model}
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500" />
    </div>
  );
}

export const AgentNode = memo(AgentNodeComponent);
