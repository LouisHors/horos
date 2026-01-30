# AI Agent 可视化编排工具 - 前端设计方案

## 目录
1. [技术选型分析](#1-技术选型分析)
2. [组件架构设计](#2-组件架构设计)
3. [核心功能实现方案](#3-核心功能实现方案)
4. [交互设计](#4-交互设计)
5. [性能优化](#5-性能优化)
6. [代码示例](#6-代码示例)

---

## 1. 技术选型分析

### 1.1 可视化库对比

| 特性 | React Flow | Vue Flow | X6 (AntV) |
|------|------------|----------|-----------|
| **框架生态** | React专用 | Vue专用 | 框架无关 (支持React/Vue/原生) |
| **节点自定义** | 优秀，React组件 | 优秀，Vue组件 | 优秀，支持多种渲染方式 |
| **性能表现** | 良好，支持虚拟化 | 良好 | 优秀，专为复杂图设计 |
| **交互功能** | 丰富，开箱即用 | 丰富 | 非常丰富，可高度定制 |
| **学习曲线** | 中等 | 中等 | 较陡峭 |
| **社区生态** | 非常活跃 | 活跃 | 中等 (中文社区强) |
| **TypeScript** | 原生支持 | 原生支持 | 原生支持 |
| **商业授权** | 免费/商业版 | 免费 | 免费 |
| **文档质量** | 优秀 | 良好 | 良好 |
| **连线能力** | 强大 | 强大 | 非常强大 |

### 1.2 详细对比分析

#### React Flow

**优点：**
- React生态最成熟的流程图库
- 组件化设计，易于自定义节点
- 丰富的插件生态（背景、小地图、控件等）
- 活跃社区，问题解决方案多
- 支持键盘快捷键、撤销重做
- 良好的TypeScript支持

**缺点：**
- 仅支持React
- 超大规模数据(1000+节点)性能需优化
- 部分高级功能需Pro版本

**适用场景：** React项目，快速开发，社区资源丰富

#### Vue Flow

**优点：**
- Vue 3组合式API设计
- 轻量级，性能良好
- API设计与React Flow类似
- 支持Vue的响应式系统

**缺点：**
- 仅支持Vue
- 生态相对React Flow较小
- 企业级案例相对较少

**适用场景：** Vue项目，需要与Vue深度集成

#### X6 (AntV)

**优点：**
- 专为复杂图编辑设计
- 极强的自定义能力
- 支持大规模数据渲染
- 丰富的图算法支持
- 阿里巴巴出品，中文文档完善
- 支持多种渲染引擎 (SVG/Canvas/HTML)

**缺点：**
- 学习曲线较陡峭
- API相对底层，开发工作量大
- 需要更多封装才能快速开发

**适用场景：** 复杂图编辑，超大规模数据，需要高度定制

### 1.3 最终推荐选型

**推荐方案：React Flow + React 18 + TypeScript**

**选型理由：**

1. **开发生态成熟**：React Flow是可视化编辑器领域最成熟的解决方案，n8n、Flowise等标杆产品均采用此方案
2. **开发效率高**：开箱即用的功能减少重复造轮子，组件化设计易于维护
3. **团队技能匹配**：假设团队熟悉React技术栈
4. **社区支持强**：遇到问题容易找到解决方案
5. **扩展性好**：支持自定义节点、边、控件，满足AI Agent编排的复杂需求
6. **TypeScript原生支持**：类型安全，开发体验好

### 1.4 UI组件库选择

**推荐：Ant Design 5.x**

**理由：**
- 企业级组件库，组件丰富
- 主题定制能力强
- 与React Flow风格协调
- 国际化支持完善
- 表单组件强大，适合属性面板

**备选：**
- **MUI (Material-UI)**：设计风格现代，但定制复杂度较高
- **Chakra UI**：轻量级，但组件丰富度不如Ant Design

---

## 2. 组件架构设计

### 2.1 整体组件层次结构

```
┌─────────────────────────────────────────────────────────────────┐
│                      FlowEditor (根组件)                         │
├──────────────┬──────────────────────────┬───────────────────────┤
│              │                          │                       │
│  ┌───────────┴──────────┐   ┌───────────┴──────────┐  ┌────────┴────────┐
│  │     NodeLibrary      │   │       Canvas         │  │ PropertiesPanel │
│  │    (节点库面板)       │   │      (画布区域)       │  │   (属性面板)     │
│  └───────────┬──────────┘   └───────────┬──────────┘  └─────────────────┘
│              │                          │
│  ┌───────────┴──────────┐   ┌───────────┴──────────┐
│  │   NodeLibraryItem    │   │     ReactFlow        │
│  │    (节点库项)         │   │   (ReactFlow组件)    │
│  └──────────────────────┘   └───────────┬──────────┘
│                                         │
│                             ┌───────────┼───────────┬───────────┐
│                             │           │           │           │
│                          ┌──┴──┐    ┌──┴──┐    ┌──┴──┐    ┌────┴────┐
│                          │Node │    │ Edge│    │Mini │    │Controls │
│                          │节点  │    │ 连线 │    │Map  │    │ 控制器  │
│                          └─────┘    └─────┘    └─────┘    └─────────┘
│
├─────────────────────────────────────────────────────────────────┤
│                      Toolbar (工具栏)                            │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 组件职责划分

| 组件 | 职责 | 复杂度 |
|------|------|--------|
| `FlowEditor` | 整体容器，协调各子组件，提供上下文 | 中 |
| `NodeLibrary` | 展示可用节点，支持拖拽创建 | 中 |
| `Canvas` | 画布容器，集成React Flow | 高 |
| `PropertiesPanel` | 属性编辑，动态表单渲染 | 高 |
| `Toolbar` | 工具按钮，操作快捷入口 | 低 |
| `CustomNode` | 自定义节点渲染 | 高 |
| `CustomEdge` | 自定义连线渲染 | 中 |

### 2.3 状态管理方案

**推荐：Zustand**

**理由：**
- 轻量级，学习成本低
- 无需Provider包裹
- 支持TypeScript
- 支持中间件（持久化、日志等）
- 性能优秀，细粒度更新

**状态分层设计：**

```typescript
// 核心状态结构
interface FlowState {
  // 画布状态
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
  
  // 选中状态
  selectedNodes: string[];
  selectedEdges: string[];
  
  // 操作历史（用于撤销重做）
  history: HistoryState[];
  historyIndex: number;
  
  // UI状态
  showGrid: boolean;
  showMinimap: boolean;
  snapToGrid: boolean;
}

// 节点定义状态
interface NodeRegistryState {
  nodeTypes: Record<string, NodeTypeDefinition>;
  categories: NodeCategory[];
}
```

**备选方案：**
- **Redux Toolkit**：适合超大型项目，但样板代码较多
- **Pinia**：如果使用Vue Flow则推荐

### 2.4 核心组件接口定义

#### FlowEditor Props

```typescript
interface FlowEditorProps {
  // 初始数据
  initialNodes?: Node[];
  initialEdges?: Edge[];
  
  // 节点类型定义
  nodeTypes?: Record<string, NodeTypeDefinition>;
  
  // 回调函数
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
  onNodeSelect?: (node: Node | null) => void;
  onConnect?: (connection: Connection) => void;
  onSave?: (data: FlowData) => void;
  
  // 配置选项
  config?: FlowEditorConfig;
  
  // 只读模式
  readOnly?: boolean;
}

interface FlowEditorConfig {
  // 画布配置
  canvas: {
    gridSize?: number;
    showGrid?: boolean;
    showMinimap?: boolean;
    snapToGrid?: boolean;
    defaultViewport?: Viewport;
  };
  
  // 交互配置
  interaction: {
    enableUndoRedo?: boolean;
    enableCopyPaste?: boolean;
    enableDelete?: boolean;
    enableMultiSelect?: boolean;
  };
  
  // 连线配置
  connection: {
    validateConnection?: (connection: Connection) => boolean;
    allowLoop?: boolean;
    maxConnections?: number;
  };
}
```

#### NodeTypeDefinition 节点类型定义

```typescript
interface NodeTypeDefinition {
  // 基础信息
  type: string;
  name: string;
  description?: string;
  icon?: string | React.ComponentType;
  category: string;
  
  // 渲染组件
  component: React.ComponentType<NodeProps>;
  
  // 默认数据
  defaultData?: Record<string, any>;
  
  // 输入/输出端口定义
  inputs?: PortDefinition[];
  outputs?: PortDefinition[];
  
  // 属性面板配置
  properties?: PropertySchema[];
  
  // 验证规则
  validate?: (data: any) => ValidationResult;
}

interface PortDefinition {
  id: string;
  name: string;
  type: 'data' | 'control' | 'trigger';
  required?: boolean;
  maxConnections?: number;
  allowedTypes?: string[];
}

interface PropertySchema {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'json' | 'code' | 'custom';
  description?: string;
  defaultValue?: any;
  required?: boolean;
  options?: Array<{ label: string; value: any }>;
  validation?: ValidationRule[];
  component?: React.ComponentType<any>;
}
```

#### NodeData 节点数据

```typescript
interface NodeData {
  // 节点ID
  id: string;
  
  // 节点类型
  type: string;
  
  // 节点位置
  position: { x: number; y: number };
  
  // 节点尺寸
  width?: number;
  height?: number;
  
  // 业务数据
  data: {
    label?: string;
    description?: string;
    config?: Record<string, any>;
    [key: string]: any;
  };
  
  // 视觉状态
  selected?: boolean;
  dragging?: boolean;
  
  // 运行时状态
  status?: 'idle' | 'running' | 'success' | 'error' | 'warning';
  executionResult?: any;
}
```

---

## 3. 核心功能实现方案

### 3.1 画布实现

#### 3.1.1 基础画布配置

```typescript
// Canvas 组件核心配置
const defaultCanvasConfig = {
  // 网格配置
  snapGrid: [16, 16] as [number, number],
  snapToGrid: true,
  
  // 连接配置
  connectionMode: ConnectionMode.Loose,
  connectionLineType: ConnectionLineType.Bezier,
  
  // 删除配置
  deleteKeyCode: ['Backspace', 'Delete'],
  
  // 多选配置
  multiSelectionKeyCode: ['Meta', 'Control'],
  selectionKeyCode: 'Shift',
  
  // 缩放配置
  minZoom: 0.1,
  maxZoom: 2,
  defaultZoom: 1,
  
  // 平移配置
  panOnScroll: true,
  panOnDrag: [1, 2] as number[], // 中键和右键平移
  
  // 交互配置
  nodesConnectable: true,
  nodesDraggable: true,
  elementsSelectable: true,
  zoomOnScroll: true,
  zoomOnPinch: true,
  zoomOnDoubleClick: false,
};
```

#### 3.1.2 画布组件结构

```typescript
// Canvas.tsx
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from 'reactflow';

interface CanvasProps {
  nodeTypes: Record<string, React.ComponentType>;
  edgeTypes?: Record<string, React.ComponentType>;
  onNodeSelect?: (node: Node | null) => void;
}

const Canvas: React.FC<CanvasProps> = ({
  nodeTypes,
  edgeTypes,
  onNodeSelect,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { project, fitView } = useReactFlow();
  
  // 选中处理
  const onSelectionChange = useCallback(({ nodes: selectedNodes }) => {
    onNodeSelect?.(selectedNodes[0] || null);
  }, [onNodeSelect]);
  
  // 连线处理
  const onConnect = useCallback((connection: Connection) => {
    // 验证连接
    if (validateConnection(connection)) {
      setEdges((eds) => addEdge(connection, eds));
    }
  }, [setEdges]);
  
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onSelectionChange={onSelectionChange}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      {...defaultCanvasConfig}
    >
      <Background variant="dots" gap={16} size={1} />
      <Controls />
      <MiniMap 
        nodeStrokeWidth={3}
        zoomable
        pannable
      />
      <Panel position="top-right">
        <CanvasToolbar />
      </Panel>
    </ReactFlow>
  );
};
```

### 3.2 节点系统

#### 3.2.1 节点类型定义

```typescript
// 内置节点类型
export enum BuiltInNodeType {
  AGENT = 'agent',
  TOOL = 'tool',
  CONDITION = 'condition',
  PARALLEL = 'parallel',
  SUBGRAPH = 'subgraph',
  START = 'start',
  END = 'end',
  LLM = 'llm',
  CODE = 'code',
  WEBHOOK = 'webhook',
}

// 节点类型配置
export const nodeTypeRegistry: Record<string, NodeTypeDefinition> = {
  [BuiltInNodeType.AGENT]: {
    type: BuiltInNodeType.AGENT,
    name: 'AI Agent',
    description: '智能代理节点',
    icon: RobotIcon,
    category: 'agent',
    component: AgentNode,
    defaultData: {
      model: 'gpt-4',
      temperature: 0.7,
      systemPrompt: '',
    },
    inputs: [
      { id: 'input', name: '输入', type: 'data', required: true },
      { id: 'trigger', name: '触发', type: 'trigger' },
    ],
    outputs: [
      { id: 'output', name: '输出', type: 'data' },
      { id: 'error', name: '错误', type: 'data' },
    ],
    properties: [
      {
        key: 'model',
        label: '模型',
        type: 'select',
        options: [
          { label: 'GPT-4', value: 'gpt-4' },
          { label: 'GPT-3.5', value: 'gpt-3.5-turbo' },
          { label: 'Claude 3', value: 'claude-3' },
        ],
        required: true,
      },
      {
        key: 'temperature',
        label: '温度',
        type: 'number',
        defaultValue: 0.7,
        validation: [
          { type: 'range', min: 0, max: 2 },
        ],
      },
      {
        key: 'systemPrompt',
        label: '系统提示词',
        type: 'code',
        description: '定义Agent的行为和角色',
      },
    ],
  },
  
  [BuiltInNodeType.CONDITION]: {
    type: BuiltInNodeType.CONDITION,
    name: '条件判断',
    description: '根据条件分支执行',
    icon: BranchIcon,
    category: 'control',
    component: ConditionNode,
    defaultData: {
      condition: '',
    },
    inputs: [
      { id: 'input', name: '输入', type: 'data' },
    ],
    outputs: [
      { id: 'true', name: '是', type: 'control' },
      { id: 'false', name: '否', type: 'control' },
    ],
    properties: [
      {
        key: 'condition',
        label: '条件表达式',
        type: 'code',
        description: 'JavaScript表达式，返回true或false',
        required: true,
      },
    ],
  },
  
  // ... 其他节点类型
};
```

#### 3.2.2 自定义节点组件

```typescript
// AgentNode.tsx
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, Tag, Badge, Tooltip } from 'antd';
import { RobotOutlined, SettingOutlined } from '@ant-design/icons';

interface AgentNodeData {
  label: string;
  model: string;
  temperature: number;
  status?: 'idle' | 'running' | 'success' | 'error';
}

const AgentNode: React.FC<NodeProps<AgentNodeData>> = ({ 
  data, 
  selected,
  isConnectable,
}) => {
  const statusColors = {
    idle: 'default',
    running: 'processing',
    success: 'success',
    error: 'error',
  };
  
  return (
    <Card
      className={`agent-node ${selected ? 'selected' : ''}`}
      size="small"
      style={{ 
        width: 240,
        borderColor: selected ? '#1890ff' : undefined,
      }}
      title={
        <div className="node-header">
          <RobotOutlined />
          <span>{data.label || 'AI Agent'}</span>
          {data.status && (
            <Badge status={statusColors[data.status]} />
          )}
        </div>
      }
      extra={
        <Tooltip title="配置">
          <SettingOutlined />
        </Tooltip>
      }
    >
      {/* 输入端口 */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        isConnectable={isConnectable}
        style={{ top: '50%' }}
      />
      
      <div className="node-content">
        <div className="node-info">
          <Tag size="small">{data.model}</Tag>
          <span className="temperature">T: {data.temperature}</span>
        </div>
      </div>
      
      {/* 输出端口 */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={isConnectable}
        style={{ top: '30%' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="error"
        isConnectable={isConnectable}
        style={{ top: '70%', background: '#ff4d4f' }}
      />
    </Card>
  );
};

// 节点样式
const nodeStyles = `
.agent-node {
  transition: all 0.2s ease;
  
  &.selected {
    box-shadow: 0 0 0 2px #1890ff;
  }
  
  .node-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .node-content {
    padding: 8px 0;
  }
  
  .node-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .temperature {
    font-size: 12px;
    color: #666;
  }
}
`;
```

#### 3.2.3 节点注册机制

```typescript
// NodeRegistry.ts
class NodeRegistry {
  private nodeTypes: Map<string, NodeTypeDefinition> = new Map();
  private components: Map<string, React.ComponentType> = new Map();
  
  // 注册节点类型
  register(definition: NodeTypeDefinition): void {
    this.nodeTypes.set(definition.type, definition);
    this.components.set(definition.type, definition.component);
  }
  
  // 批量注册
  registerMany(definitions: NodeTypeDefinition[]): void {
    definitions.forEach(def => this.register(def));
  }
  
  // 获取节点类型定义
  getDefinition(type: string): NodeTypeDefinition | undefined {
    return this.nodeTypes.get(type);
  }
  
  // 获取React组件
  getComponent(type: string): React.ComponentType | undefined {
    return this.components.get(type);
  }
  
  // 获取所有组件（用于React Flow）
  getAllComponents(): Record<string, React.ComponentType> {
    return Object.fromEntries(this.components);
  }
  
  // 按分类获取节点类型
  getByCategory(category: string): NodeTypeDefinition[] {
    return Array.from(this.nodeTypes.values())
      .filter(def => def.category === category);
  }
  
  // 搜索节点
  search(query: string): NodeTypeDefinition[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.nodeTypes.values())
      .filter(def => 
        def.name.toLowerCase().includes(lowerQuery) ||
        def.description?.toLowerCase().includes(lowerQuery)
      );
  }
  
  // 创建节点实例
  createNode(type: string, position: { x: number; y: number }): Node {
    const definition = this.getDefinition(type);
    if (!definition) {
      throw new Error(`Unknown node type: ${type}`);
    }
    
    return {
      id: generateId(),
      type,
      position,
      data: {
        label: definition.name,
        ...definition.defaultData,
      },
    };
  }
}

// 单例实例
export const nodeRegistry = new NodeRegistry();

// 初始化注册内置节点
export function initNodeRegistry(): void {
  Object.values(nodeTypeRegistry).forEach(def => {
    nodeRegistry.register(def);
  });
}
```

### 3.3 连线系统

#### 3.3.1 连线类型定义

```typescript
// Edge类型定义
export enum EdgeType {
  DEFAULT = 'default',
  BEZIER = 'bezier',
  STRAIGHT = 'straight',
  STEP = 'step',
  SMOOTHSTEP = 'smoothstep',
  ANIMATED = 'animated',
}

// 连线样式配置
export const edgeStyleConfig = {
  [EdgeType.DEFAULT]: {
    type: 'default',
    style: { stroke: '#b1b1b7', strokeWidth: 2 },
  },
  [EdgeType.ANIMATED]: {
    type: 'default',
    animated: true,
    style: { stroke: '#1890ff', strokeWidth: 2 },
  },
};

// 自定义连线组件
const CustomEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
  selected,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  
  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: selected ? '#1890ff' : style.stroke,
          strokeWidth: selected ? 3 : style.strokeWidth,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="edge-label"
        >
          {data?.label && (
            <Tag size="small" color={data.condition ? 'blue' : 'default'}>
              {data.label}
            </Tag>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
```

#### 3.3.2 连线验证

```typescript
// connectionValidator.ts
interface ConnectionValidationResult {
  valid: boolean;
  message?: string;
}

class ConnectionValidator {
  private rules: Array<(connection: Connection) => ConnectionValidationResult> = [];
  
  constructor() {
    // 注册默认规则
    this.registerDefaultRules();
  }
  
  private registerDefaultRules(): void {
    // 规则1：禁止自连接
    this.addRule((connection) => ({
      valid: connection.source !== connection.target,
      message: '不能连接到自身',
    }));
    
    // 规则2：检查端口类型兼容性
    this.addRule((connection) => {
      const sourceNode = getNode(connection.source);
      const targetNode = getNode(connection.target);
      
      if (!sourceNode || !targetNode) {
        return { valid: false, message: '节点不存在' };
      }
      
      const sourceDef = nodeRegistry.getDefinition(sourceNode.type);
      const targetDef = nodeRegistry.getDefinition(targetNode.type);
      
      const sourcePort = sourceDef?.outputs?.find(p => p.id === connection.sourceHandle);
      const targetPort = targetDef?.inputs?.find(p => p.id === connection.targetHandle);
      
      if (sourcePort && targetPort) {
        const compatible = this.checkPortCompatibility(sourcePort, targetPort);
        return {
          valid: compatible,
          message: compatible ? undefined : '端口类型不兼容',
        };
      }
      
      return { valid: true };
    });
    
    // 规则3：检查最大连接数
    this.addRule((connection) => {
      const existingConnections = getEdges().filter(
        e => e.target === connection.target && e.targetHandle === connection.targetHandle
      );
      
      const targetNode = getNode(connection.target);
      const targetDef = nodeRegistry.getDefinition(targetNode?.type || '');
      const targetPort = targetDef?.inputs?.find(p => p.id === connection.targetHandle);
      
      if (targetPort?.maxConnections) {
        return {
          valid: existingConnections.length < targetPort.maxConnections,
          message: `该端口最多允许 ${targetPort.maxConnections} 个连接`,
        };
      }
      
      return { valid: true };
    });
  }
  
  addRule(rule: (connection: Connection) => ConnectionValidationResult): void {
    this.rules.push(rule);
  }
  
  validate(connection: Connection): ConnectionValidationResult {
    for (const rule of this.rules) {
      const result = rule(connection);
      if (!result.valid) {
        return result;
      }
    }
    return { valid: true };
  }
  
  private checkPortCompatibility(source: PortDefinition, target: PortDefinition): boolean {
    // 数据端口可以连接到数据端口
    if (source.type === 'data' && target.type === 'data') {
      // 检查允许的数据类型
      if (target.allowedTypes && source.allowedTypes) {
        return source.allowedTypes.some(t => target.allowedTypes?.includes(t));
      }
      return true;
    }
    
    // 控制端口可以连接到控制端口
    if (source.type === 'control' && target.type === 'control') {
      return true;
    }
    
    // 触发端口可以连接到任何端口
    if (source.type === 'trigger') {
      return true;
    }
    
    return false;
  }
}

export const connectionValidator = new ConnectionValidator();
```

### 3.4 属性面板

#### 3.4.1 动态表单渲染

```typescript
// PropertiesPanel.tsx
import { Form, Input, InputNumber, Select, Switch, Card } from 'antd';
import CodeEditor from './CodeEditor';
import JsonEditor from './JsonEditor';

interface PropertiesPanelProps {
  node: Node | null;
  onChange?: (nodeId: string, data: any) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ 
  node, 
  onChange,
}) => {
  const [form] = Form.useForm();
  
  if (!node) {
    return (
      <div className="properties-panel empty">
        <Empty description="选择节点以编辑属性" />
      </div>
    );
  }
  
  const nodeDef = nodeRegistry.getDefinition(node.type);
  if (!nodeDef) {
    return (
      <div className="properties-panel error">
        <Empty description="未知节点类型" />
      </div>
    );
  }
  
  // 根据schema渲染表单字段
  const renderField = (prop: PropertySchema) => {
    const commonProps = {
      key: prop.key,
      name: prop.key,
      label: prop.label,
      rules: prop.required ? [{ required: true }] : undefined,
    };
    
    switch (prop.type) {
      case 'string':
        return (
          <Form.Item {...commonProps}>
            <Input placeholder={prop.description} />
          </Form.Item>
        );
        
      case 'number':
        return (
          <Form.Item {...commonProps}>
            <InputNumber 
              style={{ width: '100%' }}
              min={prop.validation?.find(v => v.type === 'range')?.min}
              max={prop.validation?.find(v => v.type === 'range')?.max}
            />
          </Form.Item>
        );
        
      case 'boolean':
        return (
          <Form.Item {...commonProps} valuePropName="checked">
            <Switch />
          </Form.Item>
        );
        
      case 'select':
        return (
          <Form.Item {...commonProps}>
            <Select options={prop.options} />
          </Form.Item>
        );
        
      case 'code':
        return (
          <Form.Item {...commonProps}>
            <CodeEditor 
              language="javascript"
              height={200}
            />
          </Form.Item>
        );
        
      case 'json':
        return (
          <Form.Item {...commonProps}>
            <JsonEditor />
          </Form.Item>
        );
        
      case 'custom':
        if (prop.component) {
          const CustomComponent = prop.component;
          return (
            <Form.Item {...commonProps}>
              <CustomComponent />
            </Form.Item>
          );
        }
        return null;
        
      default:
        return null;
    }
  };
  
  return (
    <div className="properties-panel">
      <Card 
        title={nodeDef.name}
        size="small"
        extra={nodeDef.icon && <nodeDef.icon />}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={node.data}
          onValuesChange={(_, allValues) => {
            onChange?.(node.id, allValues);
          }}
        >
          {/* 基础字段 */}
          <Form.Item name="label" label="名称">
            <Input />
          </Form.Item>
          
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          
          <Divider />
          
          {/* 动态字段 */}
          {nodeDef.properties?.map(renderField)}
        </Form>
      </Card>
    </div>
  );
};
```

#### 3.4.2 JSON Schema驱动

```typescript
// JSON Schema 转 PropertySchema
export function jsonSchemaToPropertySchema(
  schema: JSONSchema7,
  parentKey: string = ''
): PropertySchema[] {
  const properties: PropertySchema[] = [];
  
  if (schema.properties) {
    Object.entries(schema.properties).forEach(([key, propSchema]) => {
      const fullKey = parentKey ? `${parentKey}.${key}` : key;
      
      if (typeof propSchema === 'boolean') return;
      
      const property: PropertySchema = {
        key: fullKey,
        label: propSchema.title || key,
        description: propSchema.description,
        required: schema.required?.includes(key),
      };
      
      // 根据JSON Schema类型映射
      switch (propSchema.type) {
        case 'string':
          if (propSchema.enum) {
            property.type = 'select';
            property.options = propSchema.enum.map(v => ({
              label: String(v),
              value: v,
            }));
          } else if (propSchema.format === 'code') {
            property.type = 'code';
          } else {
            property.type = 'string';
          }
          break;
          
        case 'number':
        case 'integer':
          property.type = 'number';
          if (propSchema.minimum !== undefined || propSchema.maximum !== undefined) {
            property.validation = [{
              type: 'range',
              min: propSchema.minimum,
              max: propSchema.maximum,
            }];
          }
          break;
          
        case 'boolean':
          property.type = 'boolean';
          break;
          
        case 'object':
          // 递归处理嵌套对象
          if (propSchema.properties) {
            const nested = jsonSchemaToPropertySchema(propSchema, fullKey);
            properties.push(...nested);
          } else {
            property.type = 'json';
          }
          break;
          
        case 'array':
          property.type = 'json';
          break;
          
        default:
          property.type = 'string';
      }
      
      if (propSchema.default !== undefined) {
        property.defaultValue = propSchema.default;
      }
      
      properties.push(property);
    });
  }
  
  return properties;
}
```

### 3.5 节点库

#### 3.5.1 节点库组件

```typescript
// NodeLibrary.tsx
import { Collapse, Input, Empty, Tooltip } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useDrag } from 'react-dnd';

interface NodeLibraryProps {
  onDragStart?: (nodeType: string) => void;
}

const NodeLibrary: React.FC<NodeLibraryProps> = ({ onDragStart }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // 按分类分组
  const categories = useMemo(() => {
    const allTypes = Array.from(nodeRegistry.getAllDefinitions());
    
    if (searchQuery) {
      const filtered = allTypes.filter(def =>
        def.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        def.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return [{ name: '搜索结果', nodes: filtered }];
    }
    
    const grouped = allTypes.reduce((acc, def) => {
      const category = def.category || '其他';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(def);
      return acc;
    }, {} as Record<string, NodeTypeDefinition[]>);
    
    return Object.entries(grouped).map(([name, nodes]) => ({
      name,
      nodes,
    }));
  }, [searchQuery]);
  
  return (
    <div className="node-library">
      <div className="library-header">
        <Input
          prefix={<SearchOutlined />}
          placeholder="搜索节点..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          allowClear
        />
      </div>
      
      <div className="library-content">
        <Collapse defaultActiveKey={categories.map((_, i) => i)} ghost>
          {categories.map((category, index) => (
            <Collapse.Panel 
              header={category.name} 
              key={index}
            >
              <div className="node-list">
                {category.nodes.map(nodeDef => (
                  <NodeLibraryItem
                    key={nodeDef.type}
                    definition={nodeDef}
                    onDragStart={() => onDragStart?.(nodeDef.type)}
                  />
                ))}
              </div>
            </Collapse.Panel>
          ))}
        </Collapse>
        
        {categories.length === 0 && (
          <Empty description="没有找到匹配的节点" />
        )}
      </div>
    </div>
  );
};

// 节点库项组件
interface NodeLibraryItemProps {
  definition: NodeTypeDefinition;
  onDragStart?: () => void;
}

const NodeLibraryItem: React.FC<NodeLibraryItemProps> = ({ 
  definition, 
  onDragStart,
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'node',
    item: { type: definition.type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));
  
  return (
    <Tooltip title={definition.description} placement="right">
      <div
        ref={drag}
        className={`node-library-item ${isDragging ? 'dragging' : ''}`}
        onDragStart={onDragStart}
      >
        <div className="node-icon">
          {typeof definition.icon === 'string' ? (
            <img src={definition.icon} alt="" />
          ) : (
            <definition.icon />
          )}
        </div>
        <div className="node-info">
          <div className="node-name">{definition.name}</div>
          <div className="node-description">{definition.description}</div>
        </div>
      </div>
    </Tooltip>
  );
};
```

#### 3.5.2 拖拽创建节点

```typescript
// 在Canvas中处理拖拽
import { useDrop } from 'react-dnd';

const Canvas: React.FC = () => {
  const { project, screenToFlowPosition } = useReactFlow();
  
  const [, drop] = useDrop(() => ({
    accept: 'node',
    drop: (item: { type: string }, monitor) => {
      const clientOffset = monitor.getClientOffset();
      if (clientOffset) {
        // 转换屏幕坐标为画布坐标
        const position = screenToFlowPosition({
          x: clientOffset.x,
          y: clientOffset.y,
        });
        
        // 创建新节点
        const newNode = nodeRegistry.createNode(item.type, position);
        setNodes((nds) => [...nds, newNode]);
        
        // 记录操作历史
        addToHistory({ type: 'addNode', node: newNode });
      }
    },
  }));
  
  return (
    <div ref={drop} className="canvas-container">
      {/* React Flow 内容 */}
    </div>
  );
};
```

---

## 4. 交互设计

### 4.1 选中/多选/框选

```typescript
// 选中状态管理
interface SelectionState {
  selectedNodes: string[];
  selectedEdges: string[];
}

// React Flow 原生支持框选和多选
const selectionConfig = {
  // 启用选择
  elementsSelectable: true,
  
  // 框选配置
  selectionOnDrag: true,
  selectionKeyCode: 'Shift',
  
  // 多选配置
  multiSelectionKeyCode: ['Meta', 'Control'],
  
  // 选中样式
  nodeOrigin: [0.5, 0.5] as [number, number],
};

// 自定义选中样式
const selectedNodeStyle = {
  boxShadow: '0 0 0 2px #1890ff',
  borderColor: '#1890ff',
};

// 在节点组件中使用
const NodeComponent: React.FC<NodeProps> = ({ selected }) => {
  return (
    <div style={selected ? selectedNodeStyle : undefined}>
      {/* 节点内容 */}
    </div>
  );
};
```

### 4.2 复制粘贴

```typescript
// clipboardManager.ts
class ClipboardManager {
  private clipboard: { nodes: Node[]; edges: Edge[] } | null = null;
  
  copy(nodes: Node[], edges: Edge[]): void {
    // 深拷贝，避免引用问题
    this.clipboard = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };
  }
  
  paste(position?: { x: number; y: number }): { nodes: Node[]; edges: Edge[] } | null {
    if (!this.clipboard) return null;
    
    // 生成新的ID映射
    const idMap = new Map<string, string>();
    this.clipboard.nodes.forEach(node => {
      idMap.set(node.id, generateId());
    });
    
    // 计算偏移量
    const offset = position ? this.calculateOffset(position) : { x: 20, y: 20 };
    
    // 创建新节点
    const newNodes = this.clipboard.nodes.map(node => ({
      ...node,
      id: idMap.get(node.id)!,
      position: {
        x: node.position.x + offset.x,
        y: node.position.y + offset.y,
      },
      selected: false,
    }));
    
    // 创建新边
    const newEdges = this.clipboard.edges
      .filter(edge => idMap.has(edge.source) && idMap.has(edge.target))
      .map(edge => ({
        ...edge,
        id: generateId(),
        source: idMap.get(edge.source)!,
        target: idMap.get(edge.target)!,
        selected: false,
      }));
    
    return { nodes: newNodes, edges: newEdges };
  }
  
  private calculateOffset(position: { x: number; y: number }): { x: number; y: number } {
    if (!this.clipboard?.nodes.length) return { x: 0, y: 0 };
    
    // 计算原节点的中心点
    const centerX = this.clipboard.nodes.reduce((sum, n) => sum + n.position.x, 0) 
      / this.clipboard.nodes.length;
    const centerY = this.clipboard.nodes.reduce((sum, n) => sum + n.position.y, 0) 
      / this.clipboard.nodes.length;
    
    return {
      x: position.x - centerX,
      y: position.y - centerY,
    };
  }
  
  clear(): void {
    this.clipboard = null;
  }
}

export const clipboardManager = new ClipboardManager();
```

### 4.3 撤销重做机制

```typescript
// historyManager.ts
interface HistoryAction {
  type: 'addNode' | 'removeNode' | 'updateNode' | 'addEdge' | 'removeEdge' | 
        'updateEdge' | 'moveNodes' | 'batch';
  data: any;
  inverse: any;
}

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

class HistoryManager {
  private history: HistoryState[] = [];
  private index: number = -1;
  private maxHistory: number = 50;
  
  // 记录状态
  record(nodes: Node[], edges: Edge[]): void {
    // 删除当前位置之后的历史
    this.history = this.history.slice(0, this.index + 1);
    
    // 添加新状态
    this.history.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    });
    
    // 限制历史记录数量
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.index++;
    }
  }
  
  // 撤销
  undo(): HistoryState | null {
    if (this.index > 0) {
      this.index--;
      return this.history[this.index];
    }
    return null;
  }
  
  // 重做
  redo(): HistoryState | null {
    if (this.index < this.history.length - 1) {
      this.index++;
      return this.history[this.index];
    }
    return null;
  }
  
  // 是否可以撤销
  canUndo(): boolean {
    return this.index > 0;
  }
  
  // 是否可以重做
  canRedo(): boolean {
    return this.index < this.history.length - 1;
  }
  
  // 清空历史
  clear(): void {
    this.history = [];
    this.index = -1;
  }
}

// 在Zustand Store中集成
interface FlowStore {
  nodes: Node[];
  edges: Edge[];
  history: HistoryManager;
  
  // 操作函数
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  
  // 撤销重做
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const useFlowStore = create<FlowStore>((set, get) => ({
  nodes: [],
  edges: [],
  history: new HistoryManager(),
  
  setNodes: (nodes) => {
    const { history, edges } = get();
    history.record(nodes, edges);
    set({ nodes });
  },
  
  setEdges: (edges) => {
    const { history, nodes } = get();
    history.record(nodes, edges);
    set({ edges });
  },
  
  undo: () => {
    const { history } = get();
    const state = history.undo();
    if (state) {
      set({ nodes: state.nodes, edges: state.edges });
    }
  },
  
  redo: () => {
    const { history } = get();
    const state = history.redo();
    if (state) {
      set({ nodes: state.nodes, edges: state.edges });
    }
  },
  
  canUndo: () => get().history.canUndo(),
  canRedo: () => get().history.canRedo(),
}));
```

### 4.4 右键菜单

```typescript
// ContextMenu.tsx
import { Menu, Dropdown } from 'antd';
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';

interface ContextMenuProps {
  visible: boolean;
  position: { x: number; y: number };
  targetType: 'node' | 'edge' | 'canvas';
  targetId?: string;
  onClose: () => void;
  onAction: (action: string, targetId?: string) => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  visible,
  position,
  targetType,
  targetId,
  onClose,
  onAction,
}) => {
  const getMenuItems = () => {
    switch (targetType) {
      case 'node':
        return [
          {
            key: 'execute',
            icon: <PlayCircleOutlined />,
            label: '执行节点',
          },
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: '编辑属性',
          },
          {
            key: 'copy',
            icon: <CopyOutlined />,
            label: '复制',
          },
          { type: 'divider' },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: '删除',
            danger: true,
          },
        ];
        
      case 'edge':
        return [
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: '删除连线',
            danger: true,
          },
        ];
        
      case 'canvas':
        return [
          {
            key: 'paste',
            icon: <CopyOutlined />,
            label: '粘贴',
          },
          {
            key: 'selectAll',
            label: '全选',
          },
          { type: 'divider' },
          {
            key: 'fitView',
            label: '适应视图',
          },
        ];
        
      default:
        return [];
    }
  };
  
  if (!visible) return null;
  
  return (
    <div
      className="context-menu"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 1000,
      }}
    >
      <Menu
        items={getMenuItems()}
        onClick={({ key }) => {
          onAction(key, targetId);
          onClose();
        }}
      />
    </div>
  );
};

// 在Canvas中使用
const Canvas: React.FC = () => {
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    position: { x: number; y: number };
    targetType: 'node' | 'edge' | 'canvas';
    targetId?: string;
  }>({
    visible: false,
    position: { x: 0, y: 0 },
    targetType: 'canvas',
  });
  
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      position: { x: event.clientX, y: event.clientY },
      targetType: 'node',
      targetId: node.id,
    });
  }, []);
  
  const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      position: { x: event.clientX, y: event.clientY },
      targetType: 'canvas',
    });
  }, []);
  
  return (
    <>
      <ReactFlow
        onNodeContextMenu={onNodeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        // ... 其他配置
      />
      <ContextMenu
        {...contextMenu}
        onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))}
        onAction={(action, targetId) => {
          // 处理菜单操作
        }}
      />
    </>
  );
};
```

### 4.5 快捷键支持

```typescript
// useKeyboardShortcuts.ts
import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: () => void;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    shortcuts.forEach(shortcut => {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = !!shortcut.ctrl === event.ctrlKey;
      const shiftMatch = !!shortcut.shift === event.shiftKey;
      const altMatch = !!shortcut.alt === event.altKey;
      const metaMatch = !!shortcut.meta === event.metaKey;
      
      if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.handler();
      }
    });
  }, [shortcuts]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// 在FlowEditor中使用
const FlowEditor: React.FC = () => {
  const { undo, redo, canUndo, canRedo } = useFlowStore();
  const { getNodes, setNodes, getEdges, setEdges } = useReactFlow();
  
  useKeyboardShortcuts([
    // 撤销
    {
      key: 'z',
      ctrl: true,
      handler: () => {
        if (canUndo()) undo();
      },
    },
    // 重做
    {
      key: 'y',
      ctrl: true,
      handler: () => {
        if (canRedo()) redo();
      },
    },
    {
      key: 'z',
      ctrl: true,
      shift: true,
      handler: () => {
        if (canRedo()) redo();
      },
    },
    // 复制
    {
      key: 'c',
      ctrl: true,
      handler: () => {
        const selectedNodes = getNodes().filter(n => n.selected);
        const selectedEdges = getEdges().filter(e => e.selected);
        clipboardManager.copy(selectedNodes, selectedEdges);
      },
    },
    // 粘贴
    {
      key: 'v',
      ctrl: true,
      handler: () => {
        const result = clipboardManager.paste();
        if (result) {
          setNodes([...getNodes(), ...result.nodes]);
          setEdges([...getEdges(), ...result.edges]);
        }
      },
    },
    // 删除
    {
      key: 'Delete',
      handler: () => {
        const nodeIds = getNodes().filter(n => n.selected).map(n => n.id);
        const edgeIds = getEdges().filter(e => e.selected).map(e => e.id);
        
        setNodes(getNodes().filter(n => !n.selected));
        setEdges(getEdges().filter(e => !e.selected && 
          !nodeIds.includes(e.source) && 
          !nodeIds.includes(e.target)
        ));
      },
    },
    // 全选
    {
      key: 'a',
      ctrl: true,
      handler: () => {
        setNodes(getNodes().map(n => ({ ...n, selected: true })));
        setEdges(getEdges().map(e => ({ ...e, selected: true })));
      },
    },
    // 保存
    {
      key: 's',
      ctrl: true,
      handler: () => {
        // 触发保存
      },
      preventDefault: true,
    },
  ]);
  
  return (
    // ... 组件内容
  );
};
```

---

## 5. 性能优化

### 5.1 大数据量渲染优化

```typescript
// 1. 节点懒加载
import { useInView } from 'react-intersection-observer';

const LazyNode: React.FC<NodeProps> = (props) => {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });
  
  return (
    <div ref={ref}>
      {inView ? <ActualNode {...props} /> : <NodePlaceholder />}
    </div>
  );
};

// 2. 使用 React.memo 避免不必要的重渲染
const CustomNode = React.memo<NodeProps>((props) => {
  // 节点内容
}, (prevProps, nextProps) => {
  // 自定义比较函数
  return (
    prevProps.selected === nextProps.selected &&
    prevProps.dragging === nextProps.dragging &&
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data)
  );
});

// 3. 批量更新
const batchUpdate = (updates: NodeUpdate[]) => {
  unstable_batchedUpdates(() => {
    updates.forEach(update => {
      // 执行更新
    });
  });
};

// 4. 使用 Web Worker 处理复杂计算
// worker.ts
self.onmessage = (event) => {
  const { nodes, edges, algorithm } = event.data;
  
  // 执行复杂计算，如布局算法
  const result = runLayoutAlgorithm(nodes, edges, algorithm);
  
  self.postMessage(result);
};

// 使用
const layoutWorker = new Worker('./layoutWorker.ts');

const runLayout = async () => {
  layoutWorker.postMessage({ nodes, edges, algorithm: 'dagre' });
  
  return new Promise((resolve) => {
    layoutWorker.onmessage = (event) => {
      resolve(event.data);
    };
  });
};
```

### 5.2 虚拟滚动

```typescript
// 对于节点库等列表组件使用虚拟滚动
import { FixedSizeList as List } from 'react-window';

const VirtualNodeLibrary: React.FC = () => {
  const nodeTypes = useMemo(() => {
    return Array.from(nodeRegistry.getAllDefinitions());
  }, []);
  
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <NodeLibraryItem definition={nodeTypes[index]} />
    </div>
  );
  
  return (
    <List
      height={400}
      itemCount={nodeTypes.length}
      itemSize={60}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

### 5.3 防抖节流

```typescript
// hooks/useDebounce.ts
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
}

// hooks/useThrottle.ts
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  limit: number
): T {
  const inThrottle = useRef(false);
  
  return useCallback((...args: Parameters<T>) => {
    if (!inThrottle.current) {
      callback(...args);
      inThrottle.current = true;
      setTimeout(() => {
        inThrottle.current = false;
      }, limit);
    }
  }, [callback, limit]) as T;
}

// 应用示例
const Canvas: React.FC = () => {
  const { setViewport } = useReactFlow();
  
  // 防抖保存
  const debouncedSave = useDebounce((data: FlowData) => {
    saveToServer(data);
  }, 1000);
  
  // 节流缩放
  const throttledZoom = useThrottle((zoom: number) => {
    setViewport({ x: 0, y: 0, zoom });
  }, 50);
  
  useEffect(() => {
    debouncedSave({ nodes, edges });
  }, [nodes, edges]);
  
  return (
    // ... 组件内容
  );
};
```

### 5.4 性能监控

```typescript
// performanceMonitor.ts
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  
  measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    this.record(name, end - start);
    return result;
  }
  
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    this.record(name, end - start);
    return result;
  }
  
  private record(name: string, duration: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(duration);
  }
  
  getReport(): Record<string, { avg: number; max: number; min: number; count: number }> {
    const report: Record<string, any> = {};
    
    this.metrics.forEach((durations, name) => {
      const sum = durations.reduce((a, b) => a + b, 0);
      report[name] = {
        avg: sum / durations.length,
        max: Math.max(...durations),
        min: Math.min(...durations),
        count: durations.length,
      };
    });
    
    return report;
  }
}

export const perfMonitor = new PerformanceMonitor();

// React DevTools Profiler
const onRenderCallback: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) => {
  console.log('Component:', id);
  console.log('Phase:', phase);
  console.log('Actual Duration:', actualDuration);
  console.log('Base Duration:', baseDuration);
};

// 使用
<Profiler id="FlowEditor" onRender={onRenderCallback}>
  <FlowEditor />
</Profiler>
```

---

## 6. 代码示例

### 6.1 核心组件代码框架

#### FlowEditor.tsx (根组件)

```typescript
import React, { useCallback, useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';

import { Canvas } from './Canvas';
import { NodeLibrary } from './NodeLibrary';
import { PropertiesPanel } from './PropertiesPanel';
import { Toolbar } from './Toolbar';
import { useFlowStore } from './store/flowStore';
import { nodeRegistry, initNodeRegistry } from './registry/nodeRegistry';

import 'reactflow/dist/style.css';
import './styles/index.css';

export interface FlowEditorProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSave?: (data: FlowData) => void;
  onExecute?: (data: FlowData) => void;
  readOnly?: boolean;
}

export const FlowEditor: React.FC<FlowEditorProps> = ({
  initialNodes = [],
  initialEdges = [],
  onSave,
  onExecute,
  readOnly = false,
}) => {
  const { setNodes, setEdges } = useFlowStore();
  
  // 初始化节点注册表
  useEffect(() => {
    initNodeRegistry();
  }, []);
  
  // 加载初始数据
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);
  
  // 处理保存
  const handleSave = useCallback(() => {
    const { nodes, edges } = useFlowStore.getState();
    onSave?.({ nodes, edges });
  }, [onSave]);
  
  // 处理执行
  const handleExecute = useCallback(() => {
    const { nodes, edges } = useFlowStore.getState();
    onExecute?.({ nodes, edges });
  }, [onExecute]);
  
  return (
    <ConfigProvider locale={zhCN}>
      <DndProvider backend={HTML5Backend}>
        <ReactFlowProvider>
          <div className="flow-editor">
            <Toolbar 
              onSave={handleSave}
              onExecute={handleExecute}
              readOnly={readOnly}
            />
            <div className="flow-editor-body">
              {!readOnly && (
                <div className="flow-editor-sidebar">
                  <NodeLibrary />
                </div>
              )}
              <div className="flow-editor-canvas">
                <Canvas readOnly={readOnly} />
              </div>
              {!readOnly && (
                <div className="flow-editor-properties">
                  <PropertiesPanel />
                </div>
              )}
            </div>
          </div>
        </ReactFlowProvider>
      </DndProvider>
    </ConfigProvider>
  );
};

export default FlowEditor;
```

#### 样式文件 styles/index.css

```css
/* FlowEditor 基础样式 */
.flow-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.flow-editor-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.flow-editor-sidebar {
  width: 280px;
  border-right: 1px solid #e8e8e8;
  background: #fafafa;
  overflow-y: auto;
}

.flow-editor-canvas {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.flow-editor-properties {
  width: 320px;
  border-left: 1px solid #e8e8e8;
  background: #fff;
  overflow-y: auto;
}

/* 节点样式 */
.react-flow__node {
  border-radius: 8px;
  transition: box-shadow 0.2s ease;
}

.react-flow__node.selected {
  box-shadow: 0 0 0 2px #1890ff;
}

.react-flow__handle {
  width: 10px;
  height: 10px;
  background: #fff;
  border: 2px solid #1890ff;
  border-radius: 50%;
}

.react-flow__handle:hover {
  background: #1890ff;
  transform: scale(1.2);
}

/* 连线样式 */
.react-flow__edge-path {
  stroke: #b1b1b7;
  stroke-width: 2;
  transition: stroke 0.2s ease;
}

.react-flow__edge.selected .react-flow__edge-path {
  stroke: #1890ff;
  stroke-width: 3;
}

.react-flow__edge.animated .react-flow__edge-path {
  stroke: #1890ff;
}

/* 节点库样式 */
.node-library {
  padding: 16px;
}

.node-library-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  cursor: grab;
  transition: all 0.2s ease;
}

.node-library-item:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
}

.node-library-item.dragging {
  opacity: 0.5;
}

.node-library-item .node-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  background: #f0f5ff;
  border-radius: 6px;
  color: #1890ff;
}

.node-library-item .node-info {
  flex: 1;
}

.node-library-item .node-name {
  font-weight: 500;
  color: #262626;
}

.node-library-item .node-description {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 2px;
}

/* 属性面板样式 */
.properties-panel {
  padding: 16px;
}

.properties-panel.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

/* 工具栏样式 */
.flow-toolbar {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid #e8e8e8;
  background: #fff;
}

.flow-toolbar .toolbar-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.flow-toolbar .toolbar-divider {
  width: 1px;
  height: 24px;
  background: #e8e8e8;
  margin: 0 12px;
}
```

### 6.2 状态管理示例

#### store/flowStore.ts

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Node,
  Edge,
  Connection,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
} from 'reactflow';

interface FlowState {
  // 数据
  nodes: Node[];
  edges: Edge[];
  
  // 选中状态
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  
  // UI状态
  showGrid: boolean;
  showMinimap: boolean;
  snapToGrid: boolean;
  
  // 历史状态
  canUndo: boolean;
  canRedo: boolean;
}

interface FlowActions {
  // 节点操作
  setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void;
  addNode: (node: Node) => void;
  updateNode: (id: string, data: Partial<Node>) => void;
  removeNode: (id: string) => void;
  removeNodes: (ids: string[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  
  // 边操作
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void;
  addEdge: (connection: Connection) => void;
  removeEdge: (id: string) => void;
  removeEdges: (ids: string[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  
  // 选中操作
  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  
  // UI操作
  toggleGrid: () => void;
  toggleMinimap: () => void;
  toggleSnapToGrid: () => void;
  
  // 历史操作
  undo: () => void;
  redo: () => void;
  
  // 批量操作
  batchUpdate: (updates: Partial<FlowState>) => void;
}

// 历史管理
class HistoryManager {
  private history: FlowState[] = [];
  private index = -1;
  private maxSize = 50;
  
  record(state: FlowState): void {
    // 删除当前位置之后的历史
    this.history = this.history.slice(0, this.index + 1);
    
    // 深拷贝状态
    const snapshot = JSON.parse(JSON.stringify(state));
    this.history.push(snapshot);
    
    // 限制历史大小
    if (this.history.length > this.maxSize) {
      this.history.shift();
    } else {
      this.index++;
    }
  }
  
  undo(current: FlowState): FlowState | null {
    if (this.index > 0) {
      this.index--;
      return JSON.parse(JSON.stringify(this.history[this.index]));
    }
    return null;
  }
  
  redo(current: FlowState): FlowState | null {
    if (this.index < this.history.length - 1) {
      this.index++;
      return JSON.parse(JSON.stringify(this.history[this.index]));
    }
    return null;
  }
  
  canUndo(): boolean {
    return this.index > 0;
  }
  
  canRedo(): boolean {
    return this.index < this.history.length - 1;
  }
}

const historyManager = new HistoryManager();

export const useFlowStore = create<FlowState & FlowActions>()(
  devtools(
    immer((set, get) => ({
      // 初始状态
      nodes: [],
      edges: [],
      selectedNodeId: null,
      selectedEdgeId: null,
      showGrid: true,
      showMinimap: true,
      snapToGrid: true,
      canUndo: false,
      canRedo: false,
      
      // 节点操作
      setNodes: (nodes) => {
        set((state) => {
          state.nodes = typeof nodes === 'function' ? nodes(state.nodes) : nodes;
        });
        get().recordHistory();
      },
      
      addNode: (node) => {
        set((state) => {
          state.nodes.push(node);
        });
        get().recordHistory();
      },
      
      updateNode: (id, data) => {
        set((state) => {
          const node = state.nodes.find((n) => n.id === id);
          if (node) {
            Object.assign(node, data);
          }
        });
        get().recordHistory();
      },
      
      removeNode: (id) => {
        set((state) => {
          state.nodes = state.nodes.filter((n) => n.id !== id);
          // 同时删除相关的边
          state.edges = state.edges.filter(
            (e) => e.source !== id && e.target !== id
          );
        });
        get().recordHistory();
      },
      
      removeNodes: (ids) => {
        set((state) => {
          state.nodes = state.nodes.filter((n) => !ids.includes(n.id));
          state.edges = state.edges.filter(
            (e) => !ids.includes(e.source) && !ids.includes(e.target)
          );
        });
        get().recordHistory();
      },
      
      onNodesChange: (changes) => {
        set((state) => {
          state.nodes = applyNodeChanges(changes, state.nodes);
        });
      },
      
      // 边操作
      setEdges: (edges) => {
        set((state) => {
          state.edges = typeof edges === 'function' ? edges(state.edges) : edges;
        });
        get().recordHistory();
      },
      
      addEdge: (connection) => {
        set((state) => {
          state.edges = addEdge(connection, state.edges);
        });
        get().recordHistory();
      },
      
      removeEdge: (id) => {
        set((state) => {
          state.edges = state.edges.filter((e) => e.id !== id);
        });
        get().recordHistory();
      },
      
      removeEdges: (ids) => {
        set((state) => {
          state.edges = state.edges.filter((e) => !ids.includes(e.id));
        });
        get().recordHistory();
      },
      
      onEdgesChange: (changes) => {
        set((state) => {
          state.edges = applyEdgeChanges(changes, state.edges);
        });
      },
      
      onConnect: (connection) => {
        set((state) => {
          state.edges = addEdge(connection, state.edges);
        });
        get().recordHistory();
      },
      
      // 选中操作
      selectNode: (id) => {
        set((state) => {
          state.selectedNodeId = id;
          state.selectedEdgeId = null;
          // 更新节点的选中状态
          state.nodes.forEach((n) => {
            n.selected = n.id === id;
          });
        });
      },
      
      selectEdge: (id) => {
        set((state) => {
          state.selectedEdgeId = id;
          state.selectedNodeId = null;
          // 更新边的选中状态
          state.edges.forEach((e) => {
            e.selected = e.id === id;
          });
        });
      },
      
      // UI操作
      toggleGrid: () => {
        set((state) => {
          state.showGrid = !state.showGrid;
        });
      },
      
      toggleMinimap: () => {
        set((state) => {
          state.showMinimap = !state.showMinimap;
        });
      },
      
      toggleSnapToGrid: () => {
        set((state) => {
          state.snapToGrid = !state.snapToGrid;
        });
      },
      
      // 历史操作
      recordHistory: () => {
        const { nodes, edges } = get();
        historyManager.record({ nodes, edges } as FlowState);
        set((state) => {
          state.canUndo = historyManager.canUndo();
          state.canRedo = historyManager.canRedo();
        });
      },
      
      undo: () => {
        const prevState = historyManager.undo(get() as FlowState);
        if (prevState) {
          set((state) => {
            state.nodes = prevState.nodes;
            state.edges = prevState.edges;
            state.canUndo = historyManager.canUndo();
            state.canRedo = historyManager.canRedo();
          });
        }
      },
      
      redo: () => {
        const nextState = historyManager.redo(get() as FlowState);
        if (nextState) {
          set((state) => {
            state.nodes = nextState.nodes;
            state.edges = nextState.edges;
            state.canUndo = historyManager.canUndo();
            state.canRedo = historyManager.canRedo();
          });
        }
      },
      
      // 批量操作
      batchUpdate: (updates) => {
        set((state) => {
          Object.assign(state, updates);
        });
        get().recordHistory();
      },
    })),
    { name: 'flow-store' }
  )
);

// 选择器
export const selectNodes = (state: FlowState) => state.nodes;
export const selectEdges = (state: FlowState) => state.edges;
export const selectSelectedNode = (state: FlowState) =>
  state.nodes.find((n) => n.id === state.selectedNodeId);
export const selectSelectedEdge = (state: FlowState) =>
  state.edges.find((e) => e.id === state.selectedEdgeId);
```

### 6.3 自定义节点完整示例

#### nodes/AgentNode.tsx

```typescript
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, Tag, Badge, Space, Tooltip, Dropdown } from 'antd';
import {
  RobotOutlined,
  SettingOutlined,
  PlayCircleOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';

import './AgentNode.css';

// 节点数据类型
export interface AgentNodeData {
  label: string;
  description?: string;
  model: string;
  temperature: number;
  maxTokens?: number;
  systemPrompt?: string;
  status?: 'idle' | 'running' | 'success' | 'error';
  executionTime?: number;
  errorMessage?: string;
}

// 状态配置
const statusConfig = {
  idle: { color: 'default', icon: null, text: '待执行' },
  running: { color: 'processing', icon: <LoadingOutlined />, text: '执行中' },
  success: { color: 'success', icon: <CheckCircleOutlined />, text: '成功' },
  error: { color: 'error', icon: <CloseCircleOutlined />, text: '失败' },
};

// 模型标签颜色
const modelColors: Record<string, string> = {
  'gpt-4': 'blue',
  'gpt-3.5-turbo': 'cyan',
  'claude-3': 'purple',
  'claude-3-opus': 'purple',
  'gemini-pro': 'green',
};

const AgentNode: React.FC<NodeProps<AgentNodeData>> = ({
  id,
  data,
  selected,
  isConnectable,
}) => {
  const status = data.status || 'idle';
  const statusInfo = statusConfig[status];
  
  // 右键菜单项
  const menuItems = [
    {
      key: 'execute',
      icon: <PlayCircleOutlined />,
      label: '执行节点',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '高级设置',
    },
  ];
  
  return (
    <div className={`agent-node ${selected ? 'selected' : ''} ${status}`}>
      {/* 输入端口 */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        isConnectable={isConnectable}
        className="handle-input"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="trigger"
        isConnectable={isConnectable}
        className="handle-trigger"
        style={{ background: '#faad14' }}
      />
      
      <Card
        size="small"
        className="agent-node-card"
        title={
          <div className="node-header">
            <RobotOutlined className="node-icon" />
            <span className="node-title" title={data.label}>
              {data.label || 'AI Agent'}
            </span>
            <Badge 
              status={statusInfo.color as any} 
              text={statusInfo.icon}
            />
          </div>
        }
        extra={
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <MoreOutlined className="node-more" />
          </Dropdown>
        }
      >
        <div className="node-content">
          {/* 模型信息 */}
          <Space wrap className="node-tags">
            <Tag color={modelColors[data.model] || 'default'}>
              {data.model}
            </Tag>
            <Tag>T: {data.temperature}</Tag>
            {data.maxTokens && (
              <Tag>Max: {data.maxTokens}</Tag>
            )}
          </Space>
          
          {/* 描述 */}
          {data.description && (
            <Tooltip title={data.description}>
              <div className="node-description">
                {data.description}
              </div>
            </Tooltip>
          )}
          
          {/* 系统提示词预览 */}
          {data.systemPrompt && (
            <div className="prompt-preview">
              <div className="prompt-label">系统提示词</div>
              <div className="prompt-content">
                {data.systemPrompt.length > 50 
                  ? data.systemPrompt.slice(0, 50) + '...'
                  : data.systemPrompt}
              </div>
            </div>
          )}
          
          {/* 执行信息 */}
          {status === 'success' && data.executionTime && (
            <div className="execution-info success">
              执行时间: {(data.executionTime / 1000).toFixed(2)}s
            </div>
          )}
          {status === 'error' && data.errorMessage && (
            <div className="execution-info error">
              {data.errorMessage}
            </div>
          )}
        </div>
      </Card>
      
      {/* 输出端口 */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={isConnectable}
        className="handle-output"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="error"
        isConnectable={isConnectable}
        className="handle-error"
        style={{ background: '#ff4d4f' }}
      />
    </div>
  );
};

// 使用 memo 优化渲染
export default memo(AgentNode, (prevProps, nextProps) => {
  // 自定义比较函数
  return (
    prevProps.selected === nextProps.selected &&
    prevProps.dragging === nextProps.dragging &&
    prevProps.isConnectable === nextProps.isConnectable &&
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data)
  );
});
```

#### nodes/AgentNode.css

```css
.agent-node {
  width: 280px;
  transition: all 0.2s ease;
}

.agent-node.selected .agent-node-card {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px #1890ff, 0 4px 12px rgba(0, 0, 0, 0.15);
}

.agent-node.running .agent-node-card {
  border-color: #1890ff;
  animation: pulse 2s infinite;
}

.agent-node.success .agent-node-card {
  border-color: #52c41a;
}

.agent-node.error .agent-node-card {
  border-color: #ff4d4f;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(24, 144, 255, 0);
  }
}

.agent-node-card {
  border-radius: 8px;
  overflow: hidden;
}

.agent-node-card .ant-card-head {
  padding: 8px 12px;
  min-height: 40px;
  background: linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%);
}

.agent-node-card .ant-card-body {
  padding: 12px;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-icon {
  font-size: 16px;
  color: #1890ff;
}

.node-title {
  flex: 1;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-more {
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;
}

.node-more:hover {
  background: rgba(0, 0, 0, 0.04);
}

.node-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.node-tags {
  margin-bottom: 4px;
}

.node-description {
  font-size: 12px;
  color: #8c8c8c;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.prompt-preview {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 4px;
  padding: 8px;
  margin-top: 4px;
}

.prompt-label {
  font-size: 11px;
  color: #52c41a;
  font-weight: 500;
  margin-bottom: 4px;
}

.prompt-content {
  font-size: 12px;
  color: #389e0d;
  font-family: monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.execution-info {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  margin-top: 4px;
}

.execution-info.success {
  background: #f6ffed;
  color: #52c41a;
}

.execution-info.error {
  background: #fff2f0;
  color: #ff4d4f;
}

/* Handle 样式 */
.agent-node .react-flow__handle {
  width: 10px;
  height: 10px;
  background: #fff;
  border: 2px solid #1890ff;
  transition: all 0.2s ease;
}

.agent-node .react-flow__handle:hover {
  background: #1890ff;
  transform: scale(1.3);
}

.agent-node .handle-input {
  left: -5px;
}

.agent-node .handle-output {
  right: -5px;
}

.agent-node .handle-trigger {
  top: -5px;
  border-color: #faad14;
}

.agent-node .handle-error {
  bottom: -5px;
  border-color: #ff4d4f;
}
```

---

## 7. 项目结构

```
flow-editor/
├── src/
│   ├── components/
│   │   ├── FlowEditor.tsx          # 根组件
│   │   ├── Canvas.tsx              # 画布组件
│   │   ├── NodeLibrary.tsx         # 节点库
│   │   ├── PropertiesPanel.tsx     # 属性面板
│   │   ├── Toolbar.tsx             # 工具栏
│   │   ├── ContextMenu.tsx         # 右键菜单
│   │   └── CodeEditor.tsx          # 代码编辑器
│   │
│   ├── nodes/                      # 自定义节点
│   │   ├── AgentNode.tsx
│   │   ├── AgentNode.css
│   │   ├── ToolNode.tsx
│   │   ├── ConditionNode.tsx
│   │   ├── ParallelNode.tsx
│   │   └── index.ts
│   │
│   ├── edges/                      # 自定义连线
│   │   ├── CustomEdge.tsx
│   │   └── index.ts
│   │
│   ├── registry/                   # 注册表
│   │   ├── nodeRegistry.ts
│   │   └── edgeRegistry.ts
│   │
│   ├── store/                      # 状态管理
│   │   ├── flowStore.ts
│   │   └── historyStore.ts
│   │
│   ├── hooks/                      # 自定义Hooks
│   │   ├── useKeyboardShortcuts.ts
│   │   ├── useDebounce.ts
│   │   ├── useThrottle.ts
│   │   └── useClipboard.ts
│   │
│   ├── utils/                      # 工具函数
│   │   ├── idGenerator.ts
│   │   ├── validators.ts
│   │   ├── layoutAlgorithms.ts
│   │   └── performanceMonitor.ts
│   │
│   ├── types/                      # 类型定义
│   │   ├── node.ts
│   │   ├── edge.ts
│   │   └── index.ts
│   │
│   ├── styles/                     # 样式文件
│   │   ├── index.css
│   │   ├── variables.css
│   │   └── components/
│   │
│   └── index.ts                    # 入口文件
│
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 8. 依赖清单

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "reactflow": "^11.10.0",
    "zustand": "^4.4.7",
    "immer": "^10.0.3",
    "antd": "^5.12.0",
    "@ant-design/icons": "^5.2.6",
    "react-dnd": "^16.0.1",
    "react-dnd-html5-backend": "^16.0.1",
    "@monaco-editor/react": "^4.6.0",
    "lodash-es": "^4.17.21",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@types/lodash-es": "^4.17.12",
    "@types/uuid": "^9.0.7",
    "typescript": "^5.3.3",
    "vite": "^5.0.8",
    "eslint": "^8.55.0",
    "prettier": "^3.1.1"
  }
}
```

---

## 9. 总结

本设计方案提供了一个完整的AI Agent可视化编排工具前端实现方案，主要特点包括：

1. **技术选型成熟**：基于React Flow + React 18 + TypeScript，生态完善，开发效率高
2. **架构清晰**：组件职责明确，状态管理采用Zustand，性能优秀
3. **功能完整**：涵盖画布、节点、连线、属性面板等核心功能
4. **交互丰富**：支持撤销重做、复制粘贴、快捷键、右键菜单等
5. **性能优化**：提供虚拟滚动、防抖节流、懒加载等优化方案
6. **可扩展性强**：节点注册机制、JSON Schema驱动表单，易于扩展新节点类型

该方案可直接作为开发起点，根据实际需求进行调整和扩展。
