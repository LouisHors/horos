import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Bot, Settings } from 'lucide-react';

interface AgentNodeData {
  label?: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const AgentNode: React.FC<NodeProps<any>> = ({
  selected,
  data,
}) => {
  const nodeData = data as AgentNodeData;
  const model = nodeData.model || 'gpt-4';
  const temperature = nodeData.temperature ?? 0.7;

  return (
    <div
      className={`
        relative w-64 rounded-lg border-2 
        bg-white border-blue-500 
        shadow-sm transition-all duration-200
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2 shadow-lg' : 'hover:shadow-md'}
      `}
    >
      {/* 输入连接点 */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
        style={{ left: -6, top: '50%' }}
      />

      {/* 输出连接点 */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
        style={{ right: -6, top: '50%' }}
      />

      {/* 头部 */}
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-t-md border-b border-blue-100">
        <div className="w-6 h-6 rounded-md bg-blue-500 flex items-center justify-center">
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {nodeData.label || 'Agent'}
          </div>
        </div>
        {selected && (
          <Settings className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer" />
        )}
      </div>

      {/* 内容 */}
      <div className="px-3 py-2 space-y-1">
        {nodeData.systemPrompt && (
          <div className="text-xs text-gray-500 line-clamp-2">
            {nodeData.systemPrompt}
          </div>
        )}
        
        {/* 元信息 */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
            {model}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
            T: {temperature}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AgentNode;
