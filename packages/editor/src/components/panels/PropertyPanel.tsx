import React, { useMemo, useCallback } from 'react';
import { Settings, AlertCircle } from 'lucide-react';
import { useFlowStore } from '../../stores';
import { DynamicForm, FormField } from '../forms/DynamicForm';
import { NodeType, WorkflowNode } from '../../types';
import { cn } from '../../utils/cn';

// Field definitions for each node type
const nodeTypeFields: Record<string, FormField[]> = {
  [NodeType.START]: [
    {
      name: 'label',
      label: 'Label',
      type: 'text',
      placeholder: 'Start',
      required: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Workflow starting point',
      rows: 2,
    },
    {
      name: 'initialContext',
      label: 'Initial Context',
      type: 'json',
      description: 'Initial variables passed to the workflow',
      placeholder: '{\n  "userName": "John"\n}',
    },
  ],
  [NodeType.END]: [
    {
      name: 'label',
      label: 'Label',
      type: 'text',
      placeholder: 'End',
      required: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Workflow ending point',
      rows: 2,
    },
  ],
  [NodeType.AGENT]: [
    {
      name: 'label',
      label: 'Label',
      type: 'text',
      placeholder: 'Agent Name',
      required: true,
    },
    {
      name: 'model',
      label: 'Model',
      type: 'select',
      options: [
        { value: 'gpt-4', label: 'GPT-4' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
        { value: 'claude-3-opus', label: 'Claude 3 Opus' },
        { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
      ],
    },
    {
      name: 'temperature',
      label: 'Temperature',
      type: 'number',
      min: 0,
      max: 2,
      step: 0.1,
      description: 'Controls randomness (0 = deterministic, 2 = very random)',
    },
    {
      name: 'systemPrompt',
      label: 'System Prompt',
      type: 'code',
      placeholder: 'You are a helpful assistant...',
      description: 'Instructions for the AI agent',
      rows: 6,
    },
  ],
  [NodeType.TOOL]: [
    {
      name: 'label',
      label: 'Label',
      type: 'text',
      placeholder: 'Tool Name',
      required: true,
    },
    {
      name: 'toolName',
      label: 'Tool Name',
      type: 'text',
      placeholder: 'web_search',
      description: 'Identifier for the tool',
      required: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'What this tool does',
      rows: 2,
    },
    {
      name: 'toolConfig',
      label: 'Tool Configuration',
      type: 'json',
      description: 'Tool-specific configuration parameters',
    },
  ],
  [NodeType.CONDITION]: [
    {
      name: 'label',
      label: 'Label',
      type: 'text',
      placeholder: 'Condition',
      required: true,
    },
    {
      name: 'condition',
      label: 'Condition Expression',
      type: 'code',
      placeholder: 'score > 0.5',
      description: 'JavaScript expression that evaluates to true/false',
      rows: 3,
    },
  ],
};

interface PropertyPanelProps {
  className?: string;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({ className }) => {
  const { nodes, selectedNodes, updateNode } = useFlowStore();

  // Get the selected node
  const selectedNode = useMemo<WorkflowNode | undefined>(() => {
    if (selectedNodes.length !== 1) return undefined;
    return nodes.find((n) => n.id === selectedNodes[0]);
  }, [nodes, selectedNodes]);

  // Get fields for the selected node type
  const fields = useMemo<FormField[]>(() => {
    if (!selectedNode) return [];
    const type = selectedNode.type as keyof typeof nodeTypeFields;
    return nodeTypeFields[type] || [];
  }, [selectedNode]);

  // Handle field change
  const handleChange = useCallback(
    (name: string, value: unknown) => {
      if (selectedNode) {
        updateNode(selectedNode.id, { [name]: value });
      }
    },
    [selectedNode, updateNode]
  );

  // Render empty state
  if (!selectedNode) {
    return (
      <div
        className={cn(
          'w-80 bg-white border-l border-gray-200 flex flex-col h-full',
          className
        )}
      >
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Properties</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Settings className="w-12 h-12 text-gray-300 mb-3" />
          <div className="text-sm text-gray-500 font-medium">
            No node selected
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Select a node on the canvas to edit its properties
          </div>
        </div>
      </div>
    );
  }

  // Render multi-selection state
  if (selectedNodes.length > 1) {
    return (
      <div
        className={cn(
          'w-80 bg-white border-l border-gray-200 flex flex-col h-full',
          className
        )}
      >
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Properties</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="w-12 h-12 text-blue-300 mb-3" />
          <div className="text-sm text-gray-500 font-medium">
            Multiple nodes selected
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Select a single node to edit its properties
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'w-80 bg-white border-l border-gray-200 flex flex-col h-full',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={cn(
              'px-2 py-0.5 text-xs font-medium rounded-full',
              selectedNode.type === NodeType.AGENT && 'bg-blue-100 text-blue-700',
              selectedNode.type === NodeType.TOOL && 'bg-purple-100 text-purple-700',
              selectedNode.type === NodeType.CONDITION && 'bg-amber-100 text-amber-700',
              selectedNode.type === NodeType.START && 'bg-green-100 text-green-700',
              selectedNode.type === NodeType.END && 'bg-red-100 text-red-700'
            )}
          >
            {selectedNode.type}
          </span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          {selectedNode.data.label || 'Untitled'}
        </h2>
        <div className="text-xs text-gray-500 mt-0.5">ID: {selectedNode.id}</div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4">
        {fields.length > 0 ? (
          <DynamicForm
            fields={fields}
            values={selectedNode.data as Record<string, unknown>}
            onChange={handleChange}
          />
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-sm">No configurable properties</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          Changes are auto-saved
        </div>
      </div>
    </div>
  );
};

export default PropertyPanel;
