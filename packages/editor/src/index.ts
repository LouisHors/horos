// 核心组件
export { FlowCanvas } from './components/canvas';
export { NodeLibrary, PropertyPanel, Toolbar } from './components/panels';
export { 
  DynamicForm, 
  CodeEditor, 
  PromptEditor, 
  JsonEditor, 
  ScriptEditor 
} from './components/forms';
export type { 
  FormField, 
  FieldType, 
  DynamicFormProps,
  CodeEditorProps,
  PromptEditorProps,
  JsonEditorProps,
  ScriptEditorProps,
} from './components';

export {
  StartNode,
  EndNode,
  AgentNode,
  ToolNode,
  ConditionNode,
  nodeTypes,
} from './components/nodes';

// Store
export { useFlowStore, useUIStore, PanelType } from './stores';
export type { FlowState } from './stores/flowStore';
export type { UIState, DragState } from './stores';

// Hooks
export { 
  useNodeRegistry, 
  useFlowState, 
  useHistory, 
  useClipboard, 
  useKeyboard,
  createShortcuts,
  DEFAULT_SHORTCUTS,
} from './hooks';
export type { 
  UseNodeRegistryOptions, 
  UseFlowStateReturn,
  CreateNodeConfig,
  UpdateNodeConfig,
  CreateEdgeConfig,
  UseHistoryOptions,
  UseHistoryReturn,
  UseClipboardOptions,
  UseClipboardReturn,
  KeyboardShortcut,
  KeyboardShortcutsConfig,
  UseKeyboardOptions,
  UseKeyboardReturn,
} from './hooks';

// Core
export { 
  NodeRegistry, 
  nodeRegistry,
  HistoryManager,
  ClipboardManager,
} from './core';
export type {
  HistoryEntry,
  HistoryActionType,
  HistoryManagerConfig,
  ClipboardData,
  PasteOffset,
  SerializeOptions,
} from './core';

// 类型
export type {
  WorkflowNode,
  WorkflowEdge,
  WorkflowNodeData,
  AgentNodeData,
  ToolNodeData,
  ConditionNodeData,
  StartNodeData,
  EndNodeData,
  NodeDefinition,
  NodeHandle,
  CanvasState,
  FlowDefinition,
  ExecutionStatus,
  NodeExecutionStatus,
  HistoryEntry as FlowHistoryEntry,
  ClipboardData as FlowClipboardData,
} from './types';

// 类型枚举
export { NodeType } from './types';

// 工具函数
export { cn, nanoid } from './utils/cn';
export { 
  getShortcutDisplay,
  getMacShortcutDisplay,
  getPlatformShortcutDisplay,
  groupShortcutsByCategory,
  isMac,
  SHORTCUT_HELP_DATA,
  CATEGORY_NAMES,
} from './utils/shortcuts';
export type { ShortcutDefinition } from './utils/shortcuts';
