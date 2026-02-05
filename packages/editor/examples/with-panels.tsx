/**
 * 完整的可视化工作流编辑器示例
 * 展示所有面板和功能
 */

import React, { useState, useCallback } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import {
  FlowCanvas,
  NodeLibrary,
  PropertyPanel,
  Toolbar,
  ExecutionPanel,
  useFlowStore,
  useUIStore,
  PanelType,
  NodeType,
  useHistory,
  useClipboard,
  useKeyboard,
  createShortcuts,
  validateFlow,
  autoLayout,
  exportToJSON,
  importFromJSON,
  downloadFile,
  ExecutionLog,
  NodeExecutionState,
  ExecutionStatus,
} from '../src';

// 完整编辑器组件
const CompleteEditor: React.FC = () => {
  const { nodes, edges, setNodes, setEdges, selectedNodes } = useFlowStore();
  const { togglePanel, addToast } = useUIStore();
  
  // 历史管理
  const { undo, redo, canUndo, canRedo, recordAddNode, recordRemoveNode } = useHistory({
    onStateChange: ({ nodes, edges }) => {
      setNodes(nodes);
      setEdges(edges);
    },
  });
  
  // 剪贴板
  const { copy, paste, exportToFile, importFromFile } = useClipboard({
    onPaste: (data) => {
      data.nodes.forEach(node => {
        useFlowStore.getState().addNode(node);
      });
      data.edges.forEach(edge => {
        useFlowStore.getState().addEdge(edge);
      });
      addToast({ type: 'success', message: `Pasted ${data.nodes.length} nodes` });
    },
  });
  
  // 执行状态（模拟）
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>('idle');
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [nodeExecutionStates, setNodeExecutionStates] = useState<NodeExecutionState[]>([]);
  
  // 键盘快捷键
  useKeyboard({
    shortcuts: createShortcuts({
      undo: () => {
        const result = undo();
        if (result) addToast({ type: 'info', message: 'Undo' });
      },
      redo: () => {
        const result = redo();
        if (result) addToast({ type: 'info', message: 'Redo' });
      },
      copy: () => {
        const selected = nodes.filter(n => selectedNodes.includes(n.id));
        const relatedEdges = edges.filter(e => 
          selectedNodes.includes(e.source) || selectedNodes.includes(e.target)
        );
        copy(selected, relatedEdges);
        addToast({ type: 'info', message: `Copied ${selected.length} nodes` });
      },
      paste: () => {
        paste();
      },
      delete: () => {
        if (selectedNodes.length > 0) {
          selectedNodes.forEach(id => {
            const node = nodes.find(n => n.id === id);
            if (node) {
              const relatedEdges = edges.filter(e => 
                e.source === id || e.target === id
              );
              recordRemoveNode(node, relatedEdges, nodes, edges);
            }
          });
          useFlowStore.getState().removeNodes(selectedNodes);
          addToast({ type: 'info', message: `Deleted ${selectedNodes.length} nodes` });
        }
      },
      selectAll: () => {
        useFlowStore.getState().setSelectedNodes(nodes.map(n => n.id));
      },
      save: () => {
        const json = exportToJSON(nodes, edges, { name: 'My Workflow' });
        downloadFile(json, 'workflow.json', 'application/json');
        addToast({ type: 'success', message: 'Workflow saved' });
      },
      run: () => {
        setExecutionStatus('running');
        addToast({ type: 'info', message: 'Execution started' });
        
        // 模拟执行
        setTimeout(() => {
          setExecutionStatus('completed');
          addToast({ type: 'success', message: 'Execution completed' });
        }, 3000);
      },
      stop: () => {
        setExecutionStatus('idle');
        addToast({ type: 'warning', message: 'Execution stopped' });
      },
    }),
  });
  
  // 处理文件导入
  const handleImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const text = await file.text();
    const result = importFromJSON(text);
    
    if (result) {
      setNodes(result.nodes);
      setEdges(result.edges);
      addToast({ type: 'success', message: 'Workflow imported' });
    } else {
      addToast({ type: 'error', message: 'Failed to import workflow' });
    }
  }, [setNodes, setEdges, addToast]);
  
  // 自动布局
  const handleAutoLayout = useCallback(() => {
    const result = autoLayout(nodes, edges);
    setNodes(result.nodes);
    addToast({ type: 'success', message: 'Auto layout applied' });
  }, [nodes, edges, setNodes, addToast]);
  
  // 验证
  const handleValidate = useCallback(() => {
    const result = validateFlow(nodes, edges);
    if (result.valid) {
      addToast({ type: 'success', message: 'Workflow is valid' });
    } else {
      const errorCount = result.errors.length;
      addToast({ 
        type: 'error', 
        message: `Validation failed: ${errorCount} errors`,
      });
    }
  }, [nodes, edges, addToast]);
  
  // 加载示例工作流
  const loadSampleWorkflow = useCallback(() => {
    const store = useFlowStore.getState();
    store.resetCanvas();
    
    // Add Start node
    const startNode = {
      id: 'start-1',
      type: NodeType.START,
      position: { x: 100, y: 300 },
      data: { label: 'Start', type: NodeType.START },
    };
    store.addNode(startNode);
    
    // Add Agent node
    const agentNode = {
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
    };
    store.addNode(agentNode);
    
    // Add Tool node
    const toolNode = {
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
    };
    store.addNode(toolNode);
    
    // Add End node
    const endNode = {
      id: 'end-1',
      type: NodeType.END,
      position: { x: 1000, y: 300 },
      data: { label: 'End', type: NodeType.END },
    };
    store.addNode(endNode);
    
    // Add edges
    store.addEdge({ id: 'e1', source: 'start-1', target: 'agent-1', type: 'custom' });
    store.addEdge({ id: 'e2', source: 'agent-1', target: 'tool-1', type: 'custom' });
    store.addEdge({ id: 'e3', source: 'tool-1', target: 'end-1', type: 'custom' });
    
    addToast({ type: 'success', message: 'Sample workflow loaded' });
  }, [addToast]);
  
  return (
    <div className="h-screen w-full flex flex-col bg-gray-50">
      {/* Toolbar */}
      <Toolbar
        onSave={() => {
          const json = exportToJSON(nodes, edges, { name: 'My Workflow' });
          downloadFile(json, 'workflow.json', 'application/json');
        }}
        onLoad={() => document.getElementById('file-input')?.click()}
        onUndo={undo}
        onRedo={redo}
        onDelete={() => {
          if (selectedNodes.length > 0) {
            useFlowStore.getState().removeNodes(selectedNodes);
          }
        }}
        onCopy={() => {
          const selected = nodes.filter(n => selectedNodes.includes(n.id));
          const relatedEdges = edges.filter(e => 
            selectedNodes.includes(e.source) || selectedNodes.includes(e.target)
          );
          copy(selected, relatedEdges);
        }}
        onPaste={() => paste()}
        onRun={() => {
          setExecutionStatus('running');
          setExecutionLogs([
            { id: '1', timestamp: new Date(), level: 'info', message: 'Execution started' },
          ]);
          setNodeExecutionStates(nodes.map(n => ({ nodeId: n.id, status: 'pending' })));
        }}
        onStop={() => setExecutionStatus('idle')}
        onZoomIn={() => {}}
        onZoomOut={() => {}}
        onFitView={() => {}}
        canUndo={canUndo}
        canRedo={canRedo}
        hasSelection={selectedNodes.length > 0}
        isRunning={executionStatus === 'running'}
      />
      
      {/* Hidden file input */}
      <input
        id="file-input"
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImport}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Node Library */}
        <NodeLibrary />
        
        {/* Canvas */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative">
            <FlowCanvas />
            
            {/* Floating Actions */}
            <div className="absolute bottom-4 left-4 flex flex-col gap-2">
              <button
                onClick={loadSampleWorkflow}
                className="px-3 py-2 bg-white shadow-md rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200"
              >
                Load Sample
              </button>
              <button
                onClick={handleAutoLayout}
                className="px-3 py-2 bg-white shadow-md rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200"
              >
                Auto Layout
              </button>
              <button
                onClick={handleValidate}
                className="px-3 py-2 bg-white shadow-md rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200"
              >
                Validate
              </button>
            </div>
          </div>
          
          {/* Execution Panel */}
          <ExecutionPanel
            executionId={executionStatus !== 'idle' ? 'exec-001' : undefined}
            status={executionStatus}
            logs={executionLogs}
            nodeStates={nodeExecutionStates}
            onRun={() => setExecutionStatus('running')}
            onStop={() => setExecutionStatus('idle')}
            onClearLogs={() => setExecutionLogs([])}
          />
        </div>
        
        {/* Property Panel */}
        <PropertyPanel />
      </div>
    </div>
  );
};

// 包装组件
const CompleteEditorWrapper: React.FC = () => {
  return (
    <ReactFlowProvider>
      <CompleteEditor />
    </ReactFlowProvider>
  );
};

export default CompleteEditorWrapper;

// 使用说明
/*
// 在 Next.js 页面中使用:
import CompleteEditor from '@horos/editor/examples/with-panels';

export default function Page() {
  return <CompleteEditor />;
}

// 功能说明:
// - 左侧：节点库，可拖拽节点到画布
// - 中间：画布，支持拖拽、缩放、连线
// - 右侧：属性面板，编辑选中节点属性
// - 底部：执行面板，显示执行状态和日志
// - 顶部：工具栏，包含文件操作、编辑、执行控制
// - 快捷键：
//   - Ctrl+Z: 撤销
//   - Ctrl+Shift+Z: 重做
//   - Ctrl+C/V: 复制粘贴
//   - Ctrl+S: 保存
//   - F5: 运行
//   - Delete: 删除选中节点
*/
