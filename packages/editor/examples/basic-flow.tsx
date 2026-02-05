/**
 * 基础工作流示例
 * 展示如何使用 FlowCanvas 组件创建一个简单的工作流
 */

import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { FlowCanvas, useFlowStore, NodeType } from '../src';

// 示例组件
const BasicFlowExample: React.FC = () => {
  const { nodes, edges, addNode } = useFlowStore();

  // 添加示例节点
  const addSampleNodes = () => {
    const startNode = {
      id: 'start-1',
      type: NodeType.START,
      position: { x: 100, y: 200 },
      data: { label: 'Start', description: '工作流开始' },
    };

    const agentNode = {
      id: 'agent-1',
      type: NodeType.AGENT,
      position: { x: 300, y: 200 },
      data: {
        label: '助手 Agent',
        systemPrompt: '你是一个有帮助的助手',
        model: 'gpt-4',
        temperature: 0.7,
      },
    };

    const toolNode = {
      id: 'tool-1',
      type: NodeType.TOOL,
      position: { x: 550, y: 200 },
      data: {
        label: '搜索工具',
        toolName: 'web_search',
        description: '搜索网络信息',
      },
    };

    const endNode = {
      id: 'end-1',
      type: NodeType.END,
      position: { x: 800, y: 200 },
      data: { label: 'End', description: '工作流结束' },
    };

    addNode(startNode as any);
    addNode(agentNode as any);
    addNode(toolNode as any);
    addNode(endNode as any);
  };

  return (
    <div className="h-screen w-full flex flex-col">
      {/* 工具栏 */}
      <div className="h-14 border-b border-gray-200 bg-white flex items-center px-4 gap-2">
        <h1 className="text-lg font-semibold">基础工作流示例</h1>
        <div className="flex-1" />
        <button
          onClick={addSampleNodes}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          添加示例节点
        </button>
        <button
          onClick={() => useFlowStore.getState().resetCanvas()}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          清空画布
        </button>
      </div>

      {/* 画布 */}
      <div className="flex-1">
        <FlowCanvas />
      </div>

      {/* 状态信息 */}
      <div className="h-10 border-t border-gray-200 bg-gray-50 flex items-center px-4 text-sm text-gray-600">
        <span>节点数: {nodes.length}</span>
        <span className="mx-4">|</span>
        <span>连线数: {edges.length}</span>
      </div>
    </div>
  );
};

// 包装组件（提供 ReactFlowProvider）
const BasicFlowExampleWithProvider: React.FC = () => {
  return (
    <ReactFlowProvider>
      <BasicFlowExample />
    </ReactFlowProvider>
  );
};

export default BasicFlowExampleWithProvider;

// 使用说明
/*
// 在 Next.js 页面中使用:
import BasicFlowExample from '@horos/editor/examples/basic-flow';

export default function Page() {
  return <BasicFlowExample />;
}
*/
