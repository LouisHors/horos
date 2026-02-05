/**
 * 带面板的工作流编辑器示例
 * 展示 NodeLibrary 和 PropertyPanel 的使用
 */

import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import {
  FlowCanvas,
  NodeLibrary,
  PropertyPanel,
  useFlowStore,
  NodeType,
} from '../src';

// 示例组件
const EditorWithPanels: React.FC = () => {
  const { nodes, edges } = useFlowStore();

  // 添加示例节点
  const addSampleWorkflow = () => {
    const store = useFlowStore.getState();
    store.resetCanvas();

    // Add Start node
    store.addNode({
      id: 'start-1',
      type: NodeType.START,
      position: { x: 100, y: 300 },
      data: { label: 'Start', type: NodeType.START },
    });

    // Add Agent node
    store.addNode({
      id: 'agent-1',
      type: NodeType.AGENT,
      position: { x: 400, y: 300 },
      data: {
        label: 'Assistant',
        type: NodeType.AGENT,
        model: 'gpt-4',
        temperature: 0.7,
        systemPrompt: 'You are a helpful assistant.',
      },
    });

    // Add Tool node
    store.addNode({
      id: 'tool-1',
      type: NodeType.TOOL,
      position: { x: 700, y: 300 },
      data: {
        label: 'Search',
        type: NodeType.TOOL,
        toolName: 'web_search',
        description: 'Search the web for information',
        toolConfig: { limit: 5 },
      },
    });

    // Add End node
    store.addNode({
      id: 'end-1',
      type: NodeType.END,
      position: { x: 1000, y: 300 },
      data: { label: 'End', type: NodeType.END },
    });

    // Add edges
    store.addEdge({ id: 'e1', source: 'start-1', target: 'agent-1', type: 'custom' });
    store.addEdge({ id: 'e2', source: 'agent-1', target: 'tool-1', type: 'custom' });
    store.addEdge({ id: 'e3', source: 'tool-1', target: 'end-1', type: 'custom' });
  };

  return (
    <div className="h-screen w-full flex flex-col">
      {/* Header */}
      <div className="h-14 border-b border-gray-200 bg-white flex items-center px-4 gap-3">
        <h1 className="text-lg font-semibold">Visual Workflow Editor</h1>
        <div className="flex-1" />
        <button
          onClick={addSampleWorkflow}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
        >
          Load Sample Workflow
        </button>
        <button
          onClick={() => useFlowStore.getState().resetCanvas()}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          Clear
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Node Library */}
        <NodeLibrary />

        {/* Canvas */}
        <div className="flex-1 bg-gray-50">
          <FlowCanvas />
        </div>

        {/* Property Panel */}
        <PropertyPanel />
      </div>

      {/* Status Bar */}
      <div className="h-8 border-t border-gray-200 bg-gray-50 flex items-center px-4 text-xs text-gray-600 gap-4">
        <span>
          Nodes: <strong className="text-gray-900">{nodes.length}</strong>
        </span>
        <span>
          Edges: <strong className="text-gray-900">{edges.length}</strong>
        </span>
        <span className="flex-1" />
        <span>Drag nodes from library to canvas</span>
        <span className="mx-2">|</span>
        <span>Select a node to edit properties</span>
      </div>
    </div>
  );
};

// 包装组件
const EditorWithPanelsWrapper: React.FC = () => {
  return (
    <ReactFlowProvider>
      <EditorWithPanels />
    </ReactFlowProvider>
  );
};

export default EditorWithPanelsWrapper;

// 使用说明
/*
// 在 Next.js 页面中使用:
import EditorWithPanels from '@horos/editor/examples/with-panels';

export default function Page() {
  return <EditorWithPanels />;
}
*/
