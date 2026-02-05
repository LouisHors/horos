import React, { useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  BackgroundVariant,
  Panel,
  ConnectionMode,
  type XYPosition,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useFlowStore, useUIStore } from '../../stores';
import { nodeTypes } from '../nodes';
import { CustomEdge } from './CustomEdge';
import { cn } from '../../utils/cn';

// 边类型映射
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const edgeTypes: Record<string, React.ComponentType<any>> = {
  custom: CustomEdge,
};

// 内部画布组件
const FlowCanvasInner: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();
  
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setReactFlowInstance,
    clearSelection,
  } = useFlowStore();

  const {
    canvasSettings,
  } = useUIStore();

  // 设置 ReactFlow 实例
  useEffect(() => {
    setReactFlowInstance({ screenToFlowPosition, fitView });
  }, [screenToFlowPosition, fitView, setReactFlowInstance]);

  // 画布点击 - 清除选中
  const onPaneClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  // 拖拽放置处理（用于从节点库拖拽）
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const position: XYPosition = screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      // 创建新节点
      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { label: `${type} node` },
      };

      useFlowStore.getState().addNode(newNode as any);
    },
    [screenToFlowPosition]
  );

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        snapToGrid={canvasSettings.snapToGrid}
        snapGrid={[canvasSettings.gridSize, canvasSettings.gridSize]}
        fitView
        attributionPosition="bottom-right"
        deleteKeyCode={['Backspace', 'Delete']}
        selectionKeyCode={['Shift']}
        multiSelectionKeyCode={['Meta', 'Ctrl']}
        zoomActivationKeyCode={['Meta', 'Ctrl']}
        panActivationKeyCode={['Space']}
      >
        {/* 背景网格 */}
        {canvasSettings.showGrid && (
          <Background
            variant={BackgroundVariant.Dots}
            gap={canvasSettings.gridSize * 2}
            size={1}
            color="#cbd5e1"
          />
        )}

        {/* 小地图 */}
        {canvasSettings.showMinimap && (
          <MiniMap
            nodeStrokeWidth={3}
            zoomable
            pannable
            className="!bg-white !border !border-gray-200 !rounded-lg !shadow-md"
          />
        )}

        {/* 控制按钮 */}
        {canvasSettings.showControls && (
          <Controls className="!bg-white !border !border-gray-200 !shadow-md !rounded-lg" />
        )}

        {/* 状态面板 */}
        <Panel position="top-left" className="m-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 px-3 py-2 text-xs text-gray-600">
            <div className="flex items-center gap-4">
              <span>Nodes: <strong className="text-gray-900">{nodes.length}</strong></span>
              <span>Edges: <strong className="text-gray-900">{edges.length}</strong></span>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

// 带 Provider 的导出组件
export const FlowCanvas: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('w-full h-full', className)}>
      <ReactFlowProvider>
        <FlowCanvasInner />
      </ReactFlowProvider>
    </div>
  );
};

export default FlowCanvas;
