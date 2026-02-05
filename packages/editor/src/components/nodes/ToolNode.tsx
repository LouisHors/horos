import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Wrench, Settings } from 'lucide-react';

interface ToolNodeData {
  label?: string;
  toolName?: string;
  description?: string;
  toolConfig?: Record<string, unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ToolNode: React.FC<NodeProps<any>> = ({
  selected,
  data,
}) => {
  const nodeData = data as ToolNodeData;
  const toolName = nodeData.toolName || 'Tool';

  return (
    <div
      className={`
        relative w-56 rounded-lg border-2 
        bg-white border-purple-500 
        shadow-sm transition-all duration-200
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2 shadow-lg' : 'hover:shadow-md'}
      `}
    >
      {/* 输入连接点 */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white"
        style={{ left: -6, top: '50%' }}
      />

      {/* 输出连接点 */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white"
        style={{ right: -6, top: '50%' }}
      />

      {/* 头部 */}
      <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-t-md border-b border-purple-100">
        <div className="w-6 h-6 rounded-md bg-purple-500 flex items-center justify-center">
          <Wrench className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {nodeData.label || toolName}
          </div>
        </div>
        {selected && (
          <Settings className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer" />
        )}
      </div>

      {/* 内容 */}
      <div className="px-3 py-2">
        {nodeData.description && (
          <div className="text-xs text-gray-500 line-clamp-2">
            {nodeData.description}
          </div>
        )}
        
        {/* 工具配置预览 */}
        {nodeData.toolConfig && Object.keys(nodeData.toolConfig).length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">
              Config
            </div>
            <div className="text-xs text-gray-600 mt-0.5">
              {Object.keys(nodeData.toolConfig).length} parameters
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolNode;
