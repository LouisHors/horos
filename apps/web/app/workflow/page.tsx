'use client';

import { useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  ExecutionToolbar,
  useExecution,
} from '@horos/editor';

import { StartNode, AgentNode, ToolNode, EndNode } from './nodes';

const nodeTypes = {
  start: StartNode,
  agent: AgentNode,
  tool: ToolNode,
  end: EndNode,
};

const initialNodes: Node[] = [
  {
    id: 'start',
    type: 'start',
    position: { x: 250, y: 50 },
    data: { label: 'Start' },
  },
  {
    id: 'agent1',
    type: 'agent',
    position: { x: 250, y: 200 },
    data: {
      label: 'AI Agent',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      systemPrompt: 'You are a helpful assistant.',
    },
  },
  {
    id: 'end',
    type: 'end',
    position: { x: 250, y: 350 },
    data: { label: 'End' },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1', source: 'start', target: 'agent1' },
  { id: 'e2', source: 'agent1', target: 'end' },
];

export default function WorkflowPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [showResult, setShowResult] = useState(false);

  const {
    status,
    isRunning,
    nodeStates,
    result,
    error,
    start,
    pause,
    resume,
    stop,
    reset,
  } = useExecution();

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const handleRun = async () => {
    setShowResult(true);
    await start(nodes, edges);
  };

  const handleAddNode = (type: string) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: Math.random() * 300 + 100, y: Math.random() * 300 + 100 },
      data: { label: type.charAt(0).toUpperCase() + type.slice(1) },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  // 根据执行状态更新节点样式
  const nodesWithStatus = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      executionStatus: nodeStates.get(node.id)?.status,
    },
  }));

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">
          AI Workflow Editor
        </h1>
        <ExecutionToolbar
          status={status}
          onRun={handleRun}
          onPause={pause}
          onResume={resume}
          onStop={stop}
          onReset={reset}
        />
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Node Library */}
        <div className="w-64 bg-white border-r p-4">
          <h2 className="text-sm font-medium text-gray-500 uppercase mb-4">
            Node Library
          </h2>
          <div className="space-y-2">
            {[
              { type: 'start', label: 'Start', color: 'bg-green-100' },
              { type: 'agent', label: 'AI Agent', color: 'bg-blue-100' },
              { type: 'tool', label: 'Tool', color: 'bg-purple-100' },
              { type: 'end', label: 'End', color: 'bg-red-100' },
            ].map((item) => (
              <button
                key={item.type}
                onClick={() => handleAddNode(item.type)}
                className={`w-full text-left px-4 py-3 rounded-lg ${item.color} hover:opacity-80 transition-opacity`}
              >
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodesWithStatus}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        {/* Result Panel */}
        {showResult && (
          <div className="w-96 bg-white border-l p-4 overflow-auto">
            <h2 className="text-sm font-medium text-gray-500 uppercase mb-4">
              Execution Result
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-600 text-sm">{error.message}</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      result.success ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="text-sm font-medium">
                    {result.success ? 'Success' : 'Failed'}
                  </span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {result.duration}ms
                  </span>
                </div>

                {/* Node Outputs */}
                <div className="space-y-3">
                  {Array.from(result.results.entries()).map(
                    ([nodeId, output]) => (
                      <div
                        key={nodeId}
                        className="bg-gray-50 rounded-lg p-3 border"
                      >
                        <h3 className="text-xs font-medium text-gray-500 mb-2">
                          Node: {nodeId}
                        </h3>
                        <pre className="text-xs text-gray-700 overflow-auto max-h-40">
                          {JSON.stringify(output, null, 2)}
                        </pre>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {!result && !error && isRunning && (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
