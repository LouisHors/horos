# AI Agent可视化编排工具 - 数据模型与状态管理设计

## 目录
1. [概述](#概述)
2. [核心数据模型设计](#核心数据模型设计)
3. [数据结构设计](#数据结构设计)
4. [状态持久化方案](#状态持久化方案)
5. [上下文传递设计](#上下文传递设计)
6. [存储方案选型](#存储方案选型)
7. [数据库表设计](#数据库表设计)
8. [序列化方案](#序列化方案)
9. [ER图与数据流图](#er图与数据流图)

---

## 概述

### 设计目标
- 支持复杂的AI Agent工作流编排
- 提供可靠的执行状态持久化
- 支持故障恢复和时间旅行调试
- 实现高效的跨Agent上下文传递
- 保证数据一致性和可审计性

### 设计原则
1. **分离关注点**：元数据与运行时状态分离
2. **可扩展性**：支持动态添加Agent类型和节点类型
3. **版本控制**：工作流和Agent定义支持版本管理
4. **可追溯性**：完整的执行历史和审计日志
5. **高性能**：优化的存储和查询方案

---

## 核心数据模型设计

### 1. Agent定义模型 (Agent Definition)

```typescript
interface AgentDefinition {
  // 基础标识
  id: string;                    // UUID v4
  name: string;                  // Agent名称
  description: string;           // 描述
  version: string;               // 语义化版本号
  
  // 角色定义
  role: {
    type: AgentRoleType;         // system | assistant | user | custom
    persona: string;             // 角色人设描述
    constraints: string[];       // 行为约束
  };
  
  // 目标与任务
  goals: {
    primary: string;             // 主要目标
    secondary: string[];         // 次要目标
    successCriteria: string[];   // 成功标准
  };
  
  // 能力定义
  capabilities: {
    tools: ToolReference[];      // 可用工具引用
    skills: SkillDefinition[];   // 技能定义
    knowledge: KnowledgeRef[];   // 知识库引用
  };
  
  // LLM配置
  llmConfig: {
    provider: string;            // openai | anthropic | azure | local
    model: string;               // 模型名称
    temperature: number;         // 0.0 - 2.0
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
    systemPrompt: string;
    responseFormat?: 'text' | 'json' | 'json_schema';
  };
  
  // 内存配置
  memoryConfig: {
    type: MemoryType;            // short_term | long_term | hybrid
    windowSize: number;          // 上下文窗口大小
    summarizationEnabled: boolean;
    storageProvider: string;
  };
  
  // 元数据
  metadata: {
    createdAt: DateTime;
    updatedAt: DateTime;
    createdBy: string;
    tags: string[];
    category: string;
    isPublic: boolean;
  };
  
  // 状态
  status: 'draft' | 'published' | 'deprecated' | 'archived';
}

enum AgentRoleType {
  SYSTEM = 'system',
  ASSISTANT = 'assistant',
  USER = 'user',
  CUSTOM = 'custom'
}

enum MemoryType {
  SHORT_TERM = 'short_term',
  LONG_TERM = 'long_term',
  HYBRID = 'hybrid'
}
```

### 2. 工作流定义模型 (Workflow Definition)

```typescript
interface WorkflowDefinition {
  // 基础标识
  id: string;                    // UUID v4
  name: string;                  // 工作流名称
  description: string;           // 描述
  version: string;               // 语义化版本号
  
  // 执行配置
  executionConfig: {
    mode: ExecutionMode;         // sequential | parallel | hybrid
    maxConcurrency: number;      // 最大并发数
    timeout: number;             // 超时时间（秒）
    retryPolicy: RetryPolicy;    // 重试策略
    errorHandling: ErrorHandlingMode; // 错误处理方式
  };
  
  // 输入输出定义
  ioDefinition: {
    inputs: InputParameter[];    // 输入参数定义
    outputs: OutputParameter[];  // 输出参数定义
    variables: VariableDefinition[]; // 全局变量定义
  };
  
  // 节点和边
  nodes: NodeDefinition[];       // 节点定义列表
  edges: EdgeDefinition[];       // 边定义列表
  
  // 触发器配置
  triggers: TriggerConfig[];     // 触发器配置
  
  // 元数据
  metadata: {
    createdAt: DateTime;
    updatedAt: DateTime;
    createdBy: string;
    tags: string[];
    category: string;
    isTemplate: boolean;
  };
  
  // 状态
  status: 'draft' | 'published' | 'deprecated' | 'archived';
}

enum ExecutionMode {
  SEQUENTIAL = 'sequential',
  PARALLEL = 'parallel',
  HYBRID = 'hybrid'
}

interface RetryPolicy {
  maxAttempts: number;
  backoffType: 'fixed' | 'exponential' | 'linear';
  initialDelay: number;
  maxDelay: number;
  retryableErrors: string[];
}

enum ErrorHandlingMode {
  FAIL_FAST = 'fail_fast',
  CONTINUE = 'continue',
  FALLBACK = 'fallback'
}
```

### 3. 节点定义模型 (Node Definition)

```typescript
interface NodeDefinition {
  // 基础标识
  id: string;                    // 节点唯一ID（在工作流内）
  type: NodeType;                // 节点类型
  name: string;                  // 节点名称
  description: string;           // 节点描述
  
  // 位置信息（可视化编排）
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  
  // 节点配置
  config: NodeConfig;            // 类型特定的配置
  
  // 输入输出端口
  inputs: PortDefinition[];      // 输入端口
  outputs: PortDefinition[];     // 输出端口
  
  // 执行配置
  executionConfig: {
    timeout: number;
    retryPolicy?: RetryPolicy;
    condition?: string;          // 执行条件表达式
    skipOnError: boolean;
  };
  
  // 元数据
  metadata: {
    icon?: string;
    color?: string;
    customData?: Record<string, any>;
  };
}

enum NodeType {
  // AI节点
  AGENT = 'agent',               // Agent执行节点
  LLM = 'llm',                   // LLM调用节点
  PROMPT = 'prompt',             // 提示词模板节点
  
  // 控制流节点
  START = 'start',               // 开始节点
  END = 'end',                   // 结束节点
  CONDITION = 'condition',       // 条件分支节点
  LOOP = 'loop',                 // 循环节点
  PARALLEL = 'parallel',         // 并行节点
  WAIT = 'wait',                 // 等待节点
  
  // 数据处理节点
  TRANSFORM = 'transform',       // 数据转换节点
  FILTER = 'filter',             // 数据过滤节点
  AGGREGATE = 'aggregate',       // 数据聚合节点
  
  // 工具节点
  TOOL = 'tool',                 // 工具调用节点
  API = 'api',                   // API调用节点
  CODE = 'code',                 // 代码执行节点
  
  // 人机交互节点
  HUMAN = 'human',               // 人工审核节点
  INPUT = 'input',               // 用户输入节点
  
  // 子工作流
  SUBWORKFLOW = 'subworkflow',   // 子工作流节点
}

interface PortDefinition {
  id: string;
  name: string;
  type: 'data' | 'control' | 'event';
  dataType: DataType;
  required: boolean;
  defaultValue?: any;
  description?: string;
}

type NodeConfig = 
  | AgentNodeConfig
  | LLMNodeConfig
  | ConditionNodeConfig
  | LoopNodeConfig
  | ToolNodeConfig
  | CodeNodeConfig
  | HumanNodeConfig;

// Agent节点配置
interface AgentNodeConfig {
  agentId: string;               // 引用的Agent定义ID
  inputMapping: Record<string, string>; // 输入映射
  outputMapping: Record<string, string>; // 输出映射
  contextSharing: boolean;       // 是否共享上下文
}

// LLM节点配置
interface LLMNodeConfig {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  promptTemplate: string;
  variables: string[];
}

// 条件节点配置
interface ConditionNodeConfig {
  conditions: {
    id: string;
    name: string;
    expression: string;
    operator: 'and' | 'or';
    rules: ConditionRule[];
  }[];
}

interface ConditionRule {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith' | 'regex';
  value: any;
}

// 循环节点配置
interface LoopNodeConfig {
  loopType: 'for' | 'while' | 'foreach';
  iterable?: string;             // foreach的迭代变量
  condition?: string;            // while的条件表达式
  maxIterations: number;         // 最大迭代次数
  breakOnError: boolean;
}

// 工具节点配置
interface ToolNodeConfig {
  toolId: string;
  toolName: string;
  parameters: Record<string, any>;
  parameterMapping: Record<string, string>;
}

// 代码节点配置
interface CodeNodeConfig {
  language: 'python' | 'javascript' | 'typescript';
  code: string;
  dependencies: string[];
  timeout: number;
}

// 人工节点配置
interface HumanNodeConfig {
  assigneeType: 'user' | 'group' | 'role';
  assigneeId: string;
  instruction: string;
  formSchema: FormSchema;
  timeout: number;
  escalationPolicy?: EscalationPolicy;
}
```

### 4. 边定义模型 (Edge Definition)

```typescript
interface EdgeDefinition {
  // 基础标识
  id: string;                    // 边唯一ID
  
  // 连接信息
  source: {
    nodeId: string;              // 源节点ID
    portId?: string;             // 源端口ID（可选）
  };
  target: {
    nodeId: string;              // 目标节点ID
    portId?: string;             // 目标端口ID（可选）
  };
  
  // 边类型
  type: EdgeType;
  
  // 条件边配置
  condition?: {
    expression: string;          // 条件表达式
    operator: 'and' | 'or';
    rules: ConditionRule[];
  };
  
  // 数据映射
  dataMapping?: {
    source: string;
    target: string;
    transform?: string;          // 转换函数
  }[];
  
  // 可视化
  style: {
    color?: string;
    width?: number;
    style?: 'solid' | 'dashed' | 'dotted';
    label?: string;
  };
  
  // 元数据
  metadata: {
    createdAt: DateTime;
    description?: string;
  };
}

enum EdgeType {
  DEFAULT = 'default',           // 默认边
  CONDITIONAL = 'conditional',   // 条件边
  ERROR = 'error',               // 错误处理边
  TIMEOUT = 'timeout',           // 超时边
  SUCCESS = 'success',           // 成功边
  FAILURE = 'failure',           // 失败边
}
```

### 5. 执行实例模型 (Execution Instance)

```typescript
interface ExecutionInstance {
  // 基础标识
  id: string;                    // 执行实例ID
  workflowId: string;            // 工作流定义ID
  workflowVersion: string;       // 工作流版本
  
  // 执行状态
  status: ExecutionStatus;
  
  // 输入输出
  inputs: Record<string, any>;   // 输入参数
  outputs: Record<string, any>;  // 输出结果
  
  // 变量存储
  variables: VariableStore;      // 变量存储
  
  // 执行上下文
  context: ExecutionContext;     // 执行上下文
  
  // 节点执行状态
  nodeStates: Map<string, NodeExecutionState>;
  
  // 执行历史
  history: ExecutionEvent[];
  
  // 性能指标
  metrics: ExecutionMetrics;
  
  // 时间戳
  timestamps: {
    createdAt: DateTime;
    startedAt?: DateTime;
    completedAt?: DateTime;
    lastActivityAt: DateTime;
  };
  
  // 父执行（子工作流）
  parentExecutionId?: string;
  parentNodeId?: string;
  
  // 元数据
  metadata: {
    triggeredBy: string;         // 触发者
    triggerType: string;         // 触发类型
    correlationId: string;       // 关联ID（用于追踪）
    priority: number;
    tags: string[];
  };
}

enum ExecutionStatus {
  PENDING = 'pending',           // 等待执行
  RUNNING = 'running',           // 执行中
  PAUSED = 'paused',             // 暂停
  WAITING_FOR_HUMAN = 'waiting_for_human', // 等待人工介入
  COMPLETED = 'completed',       // 完成
  FAILED = 'failed',             // 失败
  CANCELLED = 'cancelled',       // 取消
  TIMEOUT = 'timeout',           // 超时
}

interface VariableStore {
  global: Record<string, VariableValue>;    // 全局变量
  local: Map<string, Record<string, VariableValue>>; // 节点局部变量
  secrets: Record<string, EncryptedValue>;  // 加密变量
}

interface VariableValue {
  value: any;
  type: DataType;
  scope: VariableScope;
  createdAt: DateTime;
  updatedAt: DateTime;
  version: number;
}

enum VariableScope {
  GLOBAL = 'global',
  LOCAL = 'local',
  INPUT = 'input',
  OUTPUT = 'output',
  TEMP = 'temp',
}

interface ExecutionContext {
  // 当前执行位置
  currentNodeId?: string;
  currentPath: string[];         // 执行路径
  
  // 执行栈
  callStack: StackFrame[];
  
  // 并行执行跟踪
  parallelBranches: Map<string, BranchState>;
  
  // 循环状态
  loopStates: Map<string, LoopState>;
  
  // 消息队列
  messageQueue: Message[];
  
  // 共享状态
  sharedState: Record<string, any>;
  
  // 会话信息
  session: {
    id: string;
    userId?: string;
    conversationId?: string;
    metadata: Record<string, any>;
  };
}

interface StackFrame {
  nodeId: string;
  nodeType: NodeType;
  inputSnapshot: Record<string, any>;
  localVariables: Record<string, any>;
  returnAddress: string;
}

interface NodeExecutionState {
  nodeId: string;
  status: NodeExecutionStatus;
  attemptCount: number;
  inputData?: Record<string, any>;
  outputData?: Record<string, any>;
  errorInfo?: ErrorInfo;
  startedAt?: DateTime;
  completedAt?: DateTime;
  duration?: number;
  logs: ExecutionLog[];
}

enum NodeExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  RETRYING = 'retrying',
  CANCELLED = 'cancelled',
}

interface ExecutionEvent {
  id: string;
  type: EventType;
  nodeId?: string;
  timestamp: DateTime;
  data: Record<string, any>;
}

enum EventType {
  EXECUTION_STARTED = 'execution_started',
  EXECUTION_COMPLETED = 'execution_completed',
  EXECUTION_FAILED = 'execution_failed',
  NODE_STARTED = 'node_started',
  NODE_COMPLETED = 'node_completed',
  NODE_FAILED = 'node_failed',
  NODE_SKIPPED = 'node_skipped',
  VARIABLE_CHANGED = 'variable_changed',
  CHECKPOINT_CREATED = 'checkpoint_created',
  HUMAN_INTERVENTION = 'human_intervention',
  MESSAGE_SENT = 'message_sent',
  MESSAGE_RECEIVED = 'message_received',
}

interface ExecutionMetrics {
  totalNodes: number;
  completedNodes: number;
  failedNodes: number;
  totalDuration: number;
  nodeDurations: Map<string, number>;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
  costEstimate: number;
}
```

### 6. 检查点模型 (Checkpoint)

```typescript
interface Checkpoint {
  // 基础标识
  id: string;                    // 检查点ID
  executionId: string;           // 关联的执行实例ID
  
  // 检查点类型
  type: CheckpointType;
  
  // 序列化状态
  state: SerializedState;
  
  // 创建信息
  createdAt: DateTime;
  createdBy: string;             // 系统/用户/节点
  
  // 元数据
  metadata: {
    nodeId?: string;             // 触发节点（如果是节点检查点）
    description?: string;        // 描述
    tags: string[];
    isAuto: boolean;             // 是否自动创建
  };
  
  // 恢复信息
  recovery: {
    canRecover: boolean;
    recoveryPoint: string;
    dependencies: string[];
  };
}

enum CheckpointType {
  INITIAL = 'initial',           // 初始状态
  NODE_BOUNDARY = 'node_boundary', // 节点边界
  PERIODIC = 'periodic',         // 周期性检查点
  USER_REQUESTED = 'user_requested', // 用户请求
  PRE_HUMAN = 'pre_human',       // 人工介入前
  POST_HUMAN = 'post_human',     // 人工介入后
  ERROR = 'error',               // 错误状态
  MILESTONE = 'milestone',       // 里程碑
}

interface SerializedState {
  // 执行实例状态
  execution: {
    status: ExecutionStatus;
    currentNodeId?: string;
    variables: Record<string, any>;
    context: ExecutionContext;
    nodeStates: Record<string, NodeExecutionState>;
  };
  
  // 节点输出缓存
  nodeOutputs: Map<string, any>;
  
  // 消息队列状态
  messageQueue: Message[];
  
  // 内存状态（Agent对话历史等）
  memoryStates: Map<string, MemoryState>;
  
  // 版本信息
  version: {
    schema: number;
    format: string;
    checksum: string;
  };
}

interface MemoryState {
  agentId: string;
  conversationHistory: Message[];
  summary?: string;
  metadata: Record<string, any>;
}
```

### 7. 消息/事件模型 (Message/Event)

```typescript
interface Message {
  // 基础标识
  id: string;                    // 消息ID
  type: MessageType;
  
  // 路由信息
  routing: {
    sender: AgentRef;
    recipient: AgentRef;
    channel?: string;
    correlationId: string;
  };
  
  // 消息内容
  content: MessageContent;
  
  // 上下文传递
  context: MessageContext;
  
  // 时间戳
  timestamps: {
    createdAt: DateTime;
    sentAt?: DateTime;
    receivedAt?: DateTime;
    processedAt?: DateTime;
  };
  
  // 优先级和超时
  priority: MessagePriority;
  ttl?: number;                  // 生存时间（秒）
  
  // 元数据
  metadata: {
    tags: string[];
    customData: Record<string, any>;
  };
}

enum MessageType {
  // Agent通信
  TASK_REQUEST = 'task_request',
  TASK_RESPONSE = 'task_response',
  TASK_DELEGATION = 'task_delegation',
  
  // 状态同步
  STATE_UPDATE = 'state_update',
  STATE_QUERY = 'state_query',
  STATE_BROADCAST = 'state_broadcast',
  
  // 事件通知
  EVENT_NOTIFICATION = 'event_notification',
  ERROR_REPORT = 'error_report',
  PROGRESS_UPDATE = 'progress_update',
  
  // 人机交互
  HUMAN_REQUEST = 'human_request',
  HUMAN_RESPONSE = 'human_response',
  
  // 系统消息
  SYSTEM_COMMAND = 'system_command',
  HEARTBEAT = 'heartbeat',
}

interface AgentRef {
  type: 'agent' | 'node' | 'workflow' | 'system' | 'user';
  id: string;
  name?: string;
}

type MessageContent = 
  | TaskRequestContent
  | TaskResponseContent
  | StateUpdateContent
  | HumanRequestContent
  | EventNotificationContent;

interface TaskRequestContent {
  taskId: string;
  taskType: string;
  parameters: Record<string, any>;
  requirements: TaskRequirements;
  deadline?: DateTime;
}

interface TaskResponseContent {
  taskId: string;
  status: 'success' | 'failure' | 'partial';
  result: any;
  error?: ErrorInfo;
  metrics?: TaskMetrics;
}

interface StateUpdateContent {
  scope: string;
  path: string;
  operation: 'set' | 'delete' | 'merge' | 'append';
  value: any;
  version: number;
}

interface HumanRequestContent {
  requestType: 'approval' | 'input' | 'review' | 'decision';
  instruction: string;
  formSchema?: FormSchema;
  attachments?: Attachment[];
  timeout: number;
}

interface EventNotificationContent {
  eventType: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  details: Record<string, any>;
}

interface MessageContext {
  // 执行上下文引用
  executionId: string;
  workflowId: string;
  nodePath: string[];
  
  // 变量快照
  variableSnapshot: Record<string, any>;
  
  // 上游上下文
  upstreamContext: Record<string, any>;
  
  // 传播控制
  propagation: {
    includeVariables: string[];
    excludeVariables: string[];
    transformRules: TransformRule[];
  };
}

enum MessagePriority {
  CRITICAL = 0,
  HIGH = 1,
  NORMAL = 2,
  LOW = 3,
}

interface Event {
  id: string;
  type: EventType;
  source: string;
  timestamp: DateTime;
  data: Record<string, any>;
  metadata: {
    executionId?: string;
    nodeId?: string;
    severity: 'debug' | 'info' | 'warning' | 'error';
    tags: string[];
  };
}
```

---

## 数据结构设计

### 数据类型系统

```typescript
enum DataType {
  // 基本类型
  STRING = 'string',
  NUMBER = 'number',
  INTEGER = 'integer',
  BOOLEAN = 'boolean',
  NULL = 'null',
  
  // 复合类型
  ARRAY = 'array',
  OBJECT = 'object',
  MAP = 'map',
  
  // 特殊类型
  DATETIME = 'datetime',
  BINARY = 'binary',
  JSON = 'json',
  REF = 'ref',
  
  // Agent相关
  MESSAGE = 'message',
  AGENT_STATE = 'agent_state',
  CONVERSATION = 'conversation',
}

interface TypeDefinition {
  type: DataType;
  nullable: boolean;
  defaultValue?: any;
  
  // 数组类型
  itemType?: TypeDefinition;
  
  // 对象类型
  properties?: Record<string, PropertyDefinition>;
  required?: string[];
  
  // 约束
  constraints?: TypeConstraints;
}

interface PropertyDefinition {
  type: DataType;
  description?: string;
  nullable?: boolean;
  defaultValue?: any;
  itemType?: TypeDefinition;
  properties?: Record<string, PropertyDefinition>;
  constraints?: TypeConstraints;
}

interface TypeConstraints {
  // 字符串约束
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: 'email' | 'url' | 'uuid' | 'date' | 'datetime';
  enum?: any[];
  
  // 数值约束
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
  
  // 数组约束
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
}
```

### 工具定义结构

```typescript
interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  
  // 参数定义
  parameters: {
    type: 'object';
    properties: Record<string, ParameterSchema>;
    required: string[];
  };
  
  // 返回值定义
  returns: {
    type: DataType;
    description: string;
    schema?: Record<string, any>;
  };
  
  // 实现信息
  implementation: {
    type: 'native' | 'http' | 'code' | 'plugin';
    config: Record<string, any>;
  };
  
  // 元数据
  metadata: {
    category: string;
    tags: string[];
    author: string;
    icon?: string;
    examples: ToolExample[];
  };
}

interface ParameterSchema {
  type: DataType;
  description: string;
  nullable?: boolean;
  defaultValue?: any;
  constraints?: TypeConstraints;
}
```

---

## 状态持久化方案

### 检查点存储策略

#### 1. 检查点触发时机

| 触发时机 | 类型 | 说明 |
|---------|------|------|
| 执行开始时 | INITIAL | 保存初始状态 |
| 每个节点执行前 | NODE_BOUNDARY | 节点输入状态 |
| 每个节点执行后 | NODE_BOUNDARY | 节点输出状态 |
| 人工介入前 | PRE_HUMAN | 等待人工审核 |
| 人工介入后 | POST_HUMAN | 人工输入后 |
| 错误发生时 | ERROR | 错误状态快照 |
| 周期性保存 | PERIODIC | 长任务定期保存 |
| 用户请求 | USER_REQUESTED | 手动保存 |
| 里程碑达成 | MILESTONE | 重要节点保存 |

#### 2. 存储内容分级

```typescript
interface CheckpointStorageLevel {
  // 轻量级检查点
  LIGHT: {
    includes: ['status', 'currentNodeId', 'variables.snapshot'];
    size: '~10KB';
    useCase: '快速恢复点';
  };
  
  // 标准检查点
  STANDARD: {
    includes: ['execution.state', 'nodeStates', 'context'];
    size: '~100KB';
    useCase: '常规故障恢复';
  };
  
  // 完整检查点
  FULL: {
    includes: ['所有状态', '消息队列', '内存状态', '节点输出缓存'];
    size: '~1MB+';
    useCase: '深度调试、时间旅行';
  };
}
```

#### 3. 检查点生命周期管理

```typescript
interface CheckpointLifecycle {
  // 保留策略
  retention: {
    maxCount: number;            // 最大保留数量
    maxAge: number;              // 最大保留时间（天）
    keepMilestones: boolean;     // 保留里程碑
    keepErrors: boolean;         // 保留错误检查点
  };
  
  // 压缩策略
  compression: {
    enabled: boolean;
    algorithm: 'gzip' | 'zstd' | 'lz4';
    level: number;
  };
  
  // 清理策略
  cleanup: {
    schedule: string;            // Cron表达式
    batchSize: number;
    dryRun: boolean;
  };
}
```

### 状态恢复流程

```
┌─────────────────┐
│   恢复请求      │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 1. 验证检查点   │
│   - 完整性校验  │
│   - 版本兼容性  │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 2. 加载状态     │
│   - 反序列化    │
│   - 依赖检查    │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 3. 重建上下文   │
│   - 变量恢复    │
│   - 消息队列    │
│   - 内存状态    │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 4. 恢复执行     │
│   - 定位节点    │
│   - 重放事件    │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 5. 验证状态     │
│   - 一致性检查  │
│   - 健康检查    │
└────────┬────────┘
         ▼
┌─────────────────┐
│   恢复完成      │
└─────────────────┘
```

---

## 上下文传递设计

### 执行上下文数据结构

```typescript
interface ExecutionContext {
  // 执行标识
  execution: {
    id: string;
    workflowId: string;
    workflowVersion: string;
    parentExecutionId?: string;
  };
  
  // 当前位置
  position: {
    currentNodeId: string;
    path: string[];              // 执行路径
    depth: number;
  };
  
  // 变量作用域
  variables: {
    global: VariableScope;       // 全局作用域
    local: Map<string, VariableScope>; // 节点局部作用域
    inherited: VariableScope;    // 继承的变量
  };
  
  // 状态共享
  shared: {
    state: Record<string, any>;
    locks: Map<string, LockInfo>;
    subscribers: Map<string, Subscriber[]>;
  };
  
  // 消息传递
  messaging: {
    inbox: Message[];
    outbox: Message[];
    subscriptions: Subscription[];
  };
  
  // 会话信息
  session: {
    id: string;
    userId?: string;
    conversationId?: string;
    metadata: Record<string, any>;
  };
  
  // 追踪信息
  tracing: {
    correlationId: string;
    spanId: string;
    parentSpanId?: string;
    traceFlags: number;
  };
}
```

### 变量作用域规则

```
┌─────────────────────────────────────────────────────────────┐
│                     全局作用域 (Global)                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │               工作流作用域 (Workflow)                  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │              节点作用域 (Node)                   │  │  │
│  │  │  ┌───────────────────────────────────────────┐  │  │  │
│  │  │  │           局部作用域 (Local)               │  │  │  │
│  │  │  │                                           │  │  │  │
│  │  │  │   变量查找顺序: Local → Node → Workflow → Global  │  │  │  │
│  │  │  │                                           │  │  │  │
│  │  │  └───────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 变量访问规则

```typescript
interface VariableAccessRules {
  // 声明规则
  declaration: {
    // 全局变量：工作流定义时声明
    global: 'workflow_definition';
    // 输入变量：执行时传入
    input: 'execution_start';
    // 局部变量：节点内创建
    local: 'node_execution';
    // 临时变量：单次计算
    temp: 'expression_evaluation';
  };
  
  // 访问规则
  access: {
    // 子作用域可以访问父作用域
    inheritUpward: true;
    // 父作用域不能直接访问子作用域
    inheritDownward: false;
    // 同层级不能互相访问
    siblingAccess: false;
  };
  
  // 修改规则
  modification: {
    // 全局变量可被任何节点修改
    global: 'any_node';
    // 输入变量只读
    input: 'readonly';
    // 局部变量只能创建节点修改
    local: 'owner_node';
    // 临时变量随时创建销毁
    temp: 'any';
  };
  
  // 生命周期
  lifecycle: {
    global: 'execution';
    input: 'execution';
    local: 'node';
    temp: 'expression';
  };
}
```

### 跨节点数据传递机制

```typescript
interface DataPassingMechanism {
  // 1. 直接传递（边数据映射）
  direct: {
    description: '通过边的dataMapping配置传递';
    config: {
      source: string;            // 源变量路径
      target: string;            // 目标变量路径
      transform?: string;        // 转换表达式
    };
    scope: 'edge';
  };
  
  // 2. 全局变量
  global: {
    description: '通过全局变量共享';
    pattern: 'read_write_shared';
    scope: 'workflow';
    concurrency: 'lock_required';
  };
  
  // 3. 消息传递
  message: {
    description: '通过消息队列异步传递';
    pattern: 'async_pub_sub';
    scope: 'cross_node';
    delivery: 'at_least_once';
  };
  
  // 4. 上下文继承
  inheritance: {
    description: '子节点继承父节点上下文';
    pattern: 'scope_inheritance';
    scope: 'hierarchical';
    filter: 'configurable';
  };
  
  // 5. 状态订阅
  subscription: {
    description: '订阅状态变化';
    pattern: 'observer_pattern';
    scope: 'dynamic';
    realtime: true;
  };
}
```

### 上下文过滤方案

```typescript
interface ContextFilterConfig {
  // 包含规则
  include: {
    variables: string[];         // 包含的变量名（支持通配符）
    patterns: string[];          // 匹配模式
    scopes: VariableScope[];     // 包含的作用域
  };
  
  // 排除规则
  exclude: {
    variables: string[];         // 排除的变量名
    patterns: string[];          // 排除模式
    prefixes: string[];          // 排除前缀
  };
  
  // 转换规则
  transform: {
    rename: Map<string, string>; // 重命名映射
    mapFields: Record<string, string>; // 字段映射
    compute: ComputeRule[];      // 计算规则
  };
  
  // 大小限制
  limits: {
    maxVariables: number;
    maxDepth: number;
    maxSize: number;             // 最大字节数
  };
}

interface ComputeRule {
  target: string;
  expression: string;
  dependencies: string[];
}
```

---

## 存储方案选型

### 存储分层架构

```
┌─────────────────────────────────────────────────────────────┐
│                    存储分层架构                              │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: 对象存储 (MinIO/S3)                                │
│  - 大文件（日志、检查点、二进制数据）                        │
│  - 备份和归档                                               │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: 文档数据库 (MongoDB)                               │
│  - 工作流定义、Agent定义（JSON文档）                        │
│  - 执行历史、事件日志                                       │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: 关系数据库 (PostgreSQL)                            │
│  - 元数据、关联关系、事务数据                               │
│  - 执行实例、检查点索引                                     │
├─────────────────────────────────────────────────────────────┤
│  Layer 0: 内存/缓存 (Redis)                                  │
│  - 运行时状态、会话数据                                     │
│  - 消息队列、分布式锁                                       │
└─────────────────────────────────────────────────────────────┘
```

### 各存储用途

| 存储类型 | 技术选型 | 存储内容 | 特点 |
|---------|---------|---------|------|
| **内存缓存** | Redis | 运行时状态、会话、锁、消息队列 | 高性能、易失性 |
| **关系数据库** | PostgreSQL | 元数据、执行实例、检查点索引 | ACID、复杂查询 |
| **文档数据库** | MongoDB | 工作流定义、Agent定义、事件日志 | 灵活Schema |
| **对象存储** | MinIO/S3 | 大检查点、日志文件、附件 | 高吞吐、低成本 |
| **时序数据库** | InfluxDB/TimescaleDB | 指标数据、性能监控 | 时序优化 |
| **搜索引擎** | Elasticsearch | 日志检索、全文搜索 | 全文索引 |

### Redis使用方案

```typescript
interface RedisSchema {
  // 执行状态缓存
  'execution:{id}': {
    type: 'hash';
    ttl: 3600;
    fields: ['status', 'currentNode', 'variables', 'context'];
  };
  
  // 会话存储
  'session:{id}': {
    type: 'hash';
    ttl: 86400;
    fields: ['userId', 'data', 'metadata'];
  };
  
  // 分布式锁
  'lock:{resource}': {
    type: 'string';
    ttl: 30;
    value: 'executionId';
  };
  
  // 消息队列
  'queue:{name}': {
    type: 'list';
    operations: ['LPUSH', 'BRPOP'];
  };
  
  // 发布订阅
  'pubsub:channel:{name}': {
    type: 'pubsub';
    patterns: ['execution:*', 'node:*'];
  };
  
  // 速率限制
  'ratelimit:{key}': {
    type: 'string';
    ttl: 60;
    value: 'count';
  };
}
```

### PostgreSQL使用方案

```typescript
interface PostgreSQLSchema {
  // 核心表
  tables: [
    'workflows',                 // 工作流定义
    'workflow_versions',         // 工作流版本
    'agents',                    // Agent定义
    'agent_versions',            // Agent版本
    'executions',                // 执行实例
    'checkpoints',               // 检查点索引
    'events',                    // 事件日志
    'messages',                  // 消息记录
    'users',                     // 用户信息
    'audit_logs',                // 审计日志
  ];
  
  // 分区策略
  partitioning: {
    events: 'RANGE (created_at) MONTHLY';
    audit_logs: 'RANGE (created_at) MONTHLY';
    executions: 'RANGE (created_at) QUARTERLY';
  };
  
  // 索引策略
  indexes: {
    executions: [
      'workflow_id, status',
      'created_at DESC',
      'correlation_id',
    ];
    events: [
      'execution_id, created_at',
      'type, created_at',
    ];
  };
}
```


---

## 数据库表设计

### 核心表结构

#### 1. 工作流定义表 (workflows)

```sql
-- 工作流定义主表
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    current_version VARCHAR(50) NOT NULL,
    
    -- 执行配置（JSON）
    execution_config JSONB NOT NULL DEFAULT '{}',
    
    -- 输入输出定义（JSON）
    io_definition JSONB NOT NULL DEFAULT '{}',
    
    -- 触发器配置（JSON）
    triggers JSONB DEFAULT '[]',
    
    -- 元数据
    category VARCHAR(100),
    tags TEXT[],
    is_template BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    
    -- 状态
    status VARCHAR(50) DEFAULT 'draft',
    
    -- 审计字段
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    -- 约束
    CONSTRAINT chk_workflow_status CHECK (status IN ('draft', 'published', 'deprecated', 'archived'))
);

-- 索引
CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_workflows_category ON workflows(category);
CREATE INDEX idx_workflows_created_by ON workflows(created_by);
CREATE INDEX idx_workflows_tags ON workflows USING GIN(tags);
```

#### 2. 工作流版本表 (workflow_versions)

```sql
-- 工作流版本表
CREATE TABLE workflow_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    version VARCHAR(50) NOT NULL,
    
    -- 版本内容
    nodes JSONB NOT NULL DEFAULT '[]',
    edges JSONB NOT NULL DEFAULT '[]',
    
    -- 变更说明
    changelog TEXT,
    
    -- 版本元数据
    is_latest BOOLEAN DEFAULT FALSE,
    
    -- 审计字段
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    -- 唯一约束
    UNIQUE(workflow_id, version)
);

-- 索引
CREATE INDEX idx_wf_versions_workflow_id ON workflow_versions(workflow_id);
CREATE INDEX idx_wf_versions_latest ON workflow_versions(workflow_id, is_latest) WHERE is_latest = TRUE;
```

#### 3. Agent定义表 (agents)

```sql
-- Agent定义主表
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    current_version VARCHAR(50) NOT NULL,
    
    -- 角色定义（JSON）
    role_config JSONB NOT NULL DEFAULT '{}',
    
    -- 目标定义（JSON）
    goals JSONB NOT NULL DEFAULT '{}',
    
    -- 能力定义（JSON）
    capabilities JSONB NOT NULL DEFAULT '{}',
    
    -- LLM配置（JSON）
    llm_config JSONB NOT NULL DEFAULT '{}',
    
    -- 内存配置（JSON）
    memory_config JSONB NOT NULL DEFAULT '{}',
    
    -- 元数据
    category VARCHAR(100),
    tags TEXT[],
    is_public BOOLEAN DEFAULT FALSE,
    
    -- 状态
    status VARCHAR(50) DEFAULT 'draft',
    
    -- 审计字段
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    -- 约束
    CONSTRAINT chk_agent_status CHECK (status IN ('draft', 'published', 'deprecated', 'archived'))
);

-- 索引
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_category ON agents(category);
CREATE INDEX idx_agents_tags ON agents USING GIN(tags);
```

#### 4. 执行实例表 (executions)

```sql
-- 执行实例表
CREATE TABLE executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id),
    workflow_version VARCHAR(50) NOT NULL,
    
    -- 执行状态
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    
    -- 输入输出（JSON）
    inputs JSONB DEFAULT '{}',
    outputs JSONB DEFAULT '{}',
    
    -- 变量存储（JSON）
    variables JSONB DEFAULT '{}',
    
    -- 执行上下文（JSON）
    context JSONB DEFAULT '{}',
    
    -- 节点状态（JSON）
    node_states JSONB DEFAULT '{}',
    
    -- 性能指标（JSON）
    metrics JSONB DEFAULT '{}',
    
    -- 父执行（子工作流）
    parent_execution_id UUID REFERENCES executions(id),
    parent_node_id VARCHAR(255),
    
    -- 时间戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 元数据
    triggered_by VARCHAR(255),
    trigger_type VARCHAR(100),
    correlation_id UUID,
    priority INTEGER DEFAULT 5,
    tags TEXT[],
    
    -- 约束
    CONSTRAINT chk_execution_status CHECK (status IN ('pending', 'running', 'paused', 'waiting_for_human', 'completed', 'failed', 'cancelled', 'timeout')),
    CONSTRAINT chk_priority CHECK (priority >= 0 AND priority <= 10)
) PARTITION BY RANGE (created_at);

-- 创建分区（按季度）
CREATE TABLE executions_y2024q1 PARTITION OF executions
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');
CREATE TABLE executions_y2024q2 PARTITION OF executions
    FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');
CREATE TABLE executions_y2024q3 PARTITION OF executions
    FOR VALUES FROM ('2024-07-01') TO ('2024-10-01');
CREATE TABLE executions_y2024q4 PARTITION OF executions
    FOR VALUES FROM ('2024-10-01') TO ('2025-01-01');

-- 索引
CREATE INDEX idx_executions_workflow ON executions(workflow_id, status);
CREATE INDEX idx_executions_status ON executions(status);
CREATE INDEX idx_executions_correlation ON executions(correlation_id);
CREATE INDEX idx_executions_created_at ON executions(created_at DESC);
CREATE INDEX idx_executions_parent ON executions(parent_execution_id);
CREATE INDEX idx_executions_tags ON executions USING GIN(tags);
```

#### 5. 检查点表 (checkpoints)

```sql
-- 检查点表
CREATE TABLE checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
    
    -- 检查点类型
    type VARCHAR(50) NOT NULL,
    
    -- 状态引用（对象存储路径）
    storage_path VARCHAR(500) NOT NULL,
    
    -- 状态大小
    state_size INTEGER,
    
    -- 创建信息
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(255) DEFAULT 'system',
    
    -- 关联节点
    node_id VARCHAR(255),
    
    -- 元数据（JSON）
    metadata JSONB DEFAULT '{}',
    
    -- 恢复信息（JSON）
    recovery_info JSONB DEFAULT '{}',
    
    -- 约束
    CONSTRAINT chk_checkpoint_type CHECK (type IN ('initial', 'node_boundary', 'periodic', 'user_requested', 'pre_human', 'post_human', 'error', 'milestone'))
);

-- 索引
CREATE INDEX idx_checkpoints_execution ON checkpoints(execution_id, created_at);
CREATE INDEX idx_checkpoints_type ON checkpoints(type);
CREATE INDEX idx_checkpoints_node ON checkpoints(node_id);
```

#### 6. 事件日志表 (events)

```sql
-- 事件日志表
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 事件类型
    type VARCHAR(100) NOT NULL,
    
    -- 事件源
    source VARCHAR(255),
    execution_id UUID REFERENCES executions(id),
    node_id VARCHAR(255),
    
    -- 事件数据（JSON）
    data JSONB NOT NULL DEFAULT '{}',
    
    -- 元数据
    severity VARCHAR(20) DEFAULT 'info',
    tags TEXT[],
    
    -- 时间戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 约束
    CONSTRAINT chk_event_severity CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical'))
) PARTITION BY RANGE (created_at);

-- 创建分区（按月）
CREATE TABLE events_y2024m01 PARTITION OF events
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE events_y2024m02 PARTITION OF events
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
-- ... 更多分区

-- 索引
CREATE INDEX idx_events_execution ON events(execution_id, created_at);
CREATE INDEX idx_events_type ON events(type, created_at);
CREATE INDEX idx_events_severity ON events(severity) WHERE severity IN ('error', 'critical');
CREATE INDEX idx_events_created_at ON events(created_at DESC);
```

#### 7. 消息表 (messages)

```sql
-- 消息表
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 消息类型
    type VARCHAR(100) NOT NULL,
    
    -- 路由信息
    sender_type VARCHAR(50) NOT NULL,
    sender_id VARCHAR(255) NOT NULL,
    recipient_type VARCHAR(50) NOT NULL,
    recipient_id VARCHAR(255) NOT NULL,
    channel VARCHAR(255),
    correlation_id UUID,
    
    -- 消息内容（JSON）
    content JSONB NOT NULL,
    
    -- 上下文（JSON）
    context JSONB DEFAULT '{}',
    
    -- 优先级
    priority INTEGER DEFAULT 2,
    
    -- 状态
    status VARCHAR(50) DEFAULT 'pending',
    
    -- 时间戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    
    -- 元数据
    metadata JSONB DEFAULT '{}',
    
    -- 约束
    CONSTRAINT chk_message_status CHECK (status IN ('pending', 'sent', 'received', 'processed', 'failed')),
    CONSTRAINT chk_message_priority CHECK (priority >= 0 AND priority <= 3)
);

-- 索引
CREATE INDEX idx_messages_sender ON messages(sender_type, sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_type, recipient_id);
CREATE INDEX idx_messages_correlation ON messages(correlation_id);
CREATE INDEX idx_messages_status ON messages(status, created_at) WHERE status = 'pending';
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
```

### 索引设计汇总

```sql
-- 复合索引优化
CREATE INDEX idx_executions_active ON executions(status, priority DESC, created_at) 
    WHERE status IN ('pending', 'running', 'paused', 'waiting_for_human');

-- 部分索引优化
CREATE INDEX idx_events_errors ON events(execution_id, created_at) 
    WHERE severity IN ('error', 'critical');

-- GIN索引用于JSON查询
CREATE INDEX idx_executions_context ON executions USING GIN(context);
CREATE INDEX idx_events_data ON events USING GIN(data);

-- 表达式索引
CREATE INDEX idx_executions_duration ON executions 
    ((EXTRACT(EPOCH FROM (completed_at - started_at)))) 
    WHERE completed_at IS NOT NULL;
```

---

## 序列化方案

### 序列化格式对比

| 格式 | 优点 | 缺点 | 适用场景 |
|-----|------|------|---------|
| **JSON** | 可读性好、通用性强 | 体积大、解析慢 | 配置数据、API交互 |
| **MessagePack** | 体积小、解析快 | 可读性差 | 内部通信、缓存 |
| **Protobuf** | 体积最小、性能最优 | 需要Schema | 高性能RPC、持久化 |
| **CBOR** | 标准格式、支持广泛 | 生态较小 | IoT、标准交换 |

### 推荐方案

```typescript
interface SerializationStrategy {
  // API交互
  api: {
    format: 'JSON';
    encoding: 'UTF-8';
    compression: 'gzip';
    schema: 'OpenAPI';
  };
  
  // 数据库存储（JSONB字段）
  database: {
    format: 'JSON';
    encoding: 'UTF-8';
    storage: 'PostgreSQL JSONB';
  };
  
  // 检查点持久化
  checkpoint: {
    format: 'MessagePack';
    compression: 'zstd';
    encryption: 'optional';
  };
  
  // 消息队列
  messaging: {
    format: 'MessagePack';
    compression: 'none';
    schema: 'Avro';
  };
  
  // 缓存
  cache: {
    format: 'MessagePack';
    compression: 'none';
    ttl: 'configurable';
  };
}
```

### 版本兼容性处理

```typescript
interface VersionCompatibility {
  // Schema版本管理
  schemaVersioning: {
    currentVersion: number;
    supportedVersions: number[];
    migrationPath: Map<number, number[]>;
  };
  
  // 数据迁移策略
  migration: {
    // 向前兼容：新版本读取旧数据
    forwardCompatible: true;
    // 向后兼容：旧版本读取新数据
    backwardCompatible: false;
    // 默认字段值
    defaultValues: Map<string, any>;
    // 字段映射
    fieldMappings: Map<string, string>;
  };
  
  // 序列化包装
  wrapper: {
    version: number;
    data: any;
    checksum: string;
    timestamp: DateTime;
  };
}

// 版本迁移示例
const schemaMigrations = {
  1: {  // 初始版本
    fields: ['id', 'name', 'config'],
  },
  2: {  // 添加metadata字段
    fields: ['id', 'name', 'config', 'metadata'],
    migrate: (v1: any) => ({
      ...v1,
      metadata: {},
    }),
  },
  3: {  // 重构config结构
    fields: ['id', 'name', 'config', 'metadata', 'version'],
    migrate: (v2: any) => ({
      ...v2,
      config: { settings: v2.config },
      version: '1.0.0',
    }),
  },
};
```

---

## ER图与数据流图

### 实体关系图（ER图）文字描述

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              实体关系图                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐         1:N          ┌──────────────────┐                 │
│  │   workflows  │──────────────────────│ workflow_versions│                 │
│  │──────────────│                      │──────────────────│                 │
│  │ id (PK)      │         1:N          │ id (PK)          │                 │
│  │ name         │──────────────────────│ workflow_id (FK) │                 │
│  │ current_ver  │                      │ version          │                 │
│  └──────────────┘                      └──────────────────┘                 │
│         │                                                                    │
│         │ 1:N                                                                │
│         ▼                                                                    │
│  ┌──────────────┐         N:1          ┌──────────────────┐                 │
│  │  executions  │──────────────────────│  checkpoints     │                 │
│  │──────────────│                      │──────────────────│                 │
│  │ id (PK)      │         1:N          │ id (PK)          │                 │
│  │ workflow_id  │──────────────────────│ execution_id(FK) │                 │
│  │ status       │                      │ storage_path     │                 │
│  │ variables    │                      │ type             │                 │
│  └──────────────┘                      └──────────────────┘                 │
│         │                                                                    │
│         │ 1:N                                                                │
│         ▼                                                                    │
│  ┌──────────────┐         1:N          ┌──────────────────┐                 │
│  │    events    │                      │    messages      │                 │
│  │──────────────│                      │──────────────────│                 │
│  │ id (PK)      │                      │ id (PK)          │                 │
│  │ execution_id │                      │ type             │                 │
│  │ type         │                      │ sender_id        │                 │
│  │ data         │                      │ recipient_id     │                 │
│  └──────────────┘                      │ content          │                 │
│                                        └──────────────────┘                 │
│                                                                              │
│  ┌──────────────┐         1:N          ┌──────────────────┐                 │
│  │    agents    │──────────────────────│  agent_versions  │                 │
│  │──────────────│                      │──────────────────│                 │
│  │ id (PK)      │                      │ id (PK)          │                 │
│  │ name         │                      │ agent_id (FK)    │                 │
│  │ llm_config   │                      │ version          │                 │
│  └──────────────┘                      └──────────────────┘                 │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 关系说明

| 关系 | 类型 | 说明 |
|-----|------|------|
| workflows → workflow_versions | 1:N | 一个工作流有多个版本 |
| workflows → executions | 1:N | 一个工作流有多个执行实例 |
| executions → checkpoints | 1:N | 一个执行有多个检查点 |
| executions → events | 1:N | 一个执行产生多个事件 |
| executions → messages | 1:N | 一个执行产生多个消息 |
| agents → agent_versions | 1:N | 一个Agent有多个版本 |

### 数据流图

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              数据流图                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │  设计时   │───▶│ 元数据   │───▶│  存储    │───▶│  查询    │              │
│  │  (UI)    │    │ 转换     │    │ (PG/Mongo│    │  服务    │              │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘              │
│       │                                              │                       │
│       │ 工作流定义                                     │ 元数据               │
│       ▼                                              ▼                       │
│  ┌────────────────────────────────────────────────────────┐                 │
│  │                    编排引擎                             │                 │
│  │  ┌──────────┐    ┌──────────┐    ┌──────────┐         │                 │
│  │  │ 调度器   │───▶│ 执行器   │───▶│ 状态机   │         │                 │
│  │  └──────────┘    └──────────┘    └──────────┘         │                 │
│  │       │               │               │                │                 │
│  └───────┼───────────────┼───────────────┼────────────────┘                 │
│          │               │               │                                   │
│          ▼               ▼               ▼                                   │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                              │
│  │  Redis   │    │ 检查点   │    │ 事件总线 │                              │
│  │ (运行时  │    │ 管理器   │    │          │                              │
│  │  状态)   │    │          │    │          │                              │
│  └──────────┘    └────┬─────┘    └──────────┘                              │
│                       │                                                      │
│                       ▼                                                      │
│              ┌─────────────────┐                                             │
│              │   对象存储      │                                             │
│              │ (MinIO/S3)      │                                             │
│              │ - 检查点文件    │                                             │
│              │ - 日志归档      │                                             │
│              └─────────────────┘                                             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 执行流程数据流

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           执行流程数据流                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   开始                                                                       │
│    │                                                                         │
│    ▼                                                                         │
│  ┌─────────────────┐                                                         │
│  │ 创建执行实例    │──▶ executions表                                        │
│  └────────┬────────┘                                                         │
│           │                                                                  │
│           ▼                                                                  │
│  ┌─────────────────┐                                                         │
│  │ 保存初始检查点  │──▶ checkpoints表 + 对象存储                           │
│  └────────┬────────┘                                                         │
│           │                                                                  │
│           ▼                                                                  │
│  ┌─────────────────┐     ┌─────────────────┐                                │
│  │ 执行节点        │◄────│ 加载检查点      │                                │
│  │                 │     │ (故障恢复时)    │                                │
│  └────────┬────────┘     └─────────────────┘                                │
│           │                                                                  │
│     ┌─────┴─────┐                                                            │
│     ▼           ▼                                                            │
│  ┌──────┐   ┌────────┐                                                       │
│  │ 成功 │   │ 失败   │                                                       │
│  └──┬───┘   └───┬────┘                                                       │
│     │           │                                                            │
│     ▼           ▼                                                            │
│  ┌─────────────────┐   ┌─────────────────┐                                  │
│  │ 保存节点检查点  │   │ 保存错误检查点  │                                  │
│  └────────┬────────┘   └────────┬────────┘                                  │
│           │                     │                                            │
│           └──────────┬──────────┘                                            │
│                      ▼                                                       │
│              ┌───────────────┐                                               │
│              │ 记录事件      │──▶ events表                                   │
│              └───────┬───────┘                                               │
│                      │                                                       │
│                      ▼                                                       │
│              ┌───────────────┐                                               │
│              │ 更新执行状态  │──▶ executions表                               │
│              └───────┬───────┘                                               │
│                      │                                                       │
│              ┌───────┴───────┐                                               │
│              ▼               ▼                                               │
│         ┌────────┐      ┌────────┐                                          │
│         │ 继续   │      │ 结束   │                                          │
│         │ 下一个 │      │ 执行   │                                          │
│         │ 节点   │      │        │                                          │
│         └────────┘      └────────┘                                          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 总结

### 设计要点

1. **分层存储架构**：内存缓存 + 关系数据库 + 文档数据库 + 对象存储，满足不同场景需求

2. **灵活的数据模型**：JSONB字段存储动态配置，支持快速迭代和扩展

3. **完善的检查点机制**：多级检查点策略，支持故障恢复和时间旅行调试

4. **清晰的变量作用域**：Local → Node → Workflow → Global，避免命名冲突

5. **高效的消息传递**：支持同步和异步通信，满足跨Agent协作需求

6. **版本兼容性**：Schema版本管理和数据迁移策略，保证平滑升级

### 性能优化

- 数据库分区策略（按时间）
- 多级索引设计
- Redis缓存热点数据
- MessagePack序列化减少传输开销
- 检查点压缩和增量存储

### 可靠性保障

- 检查点定期保存
- 分布式锁防止竞态条件
- 幂等性设计
- 完整的审计日志
- 数据备份和恢复策略
