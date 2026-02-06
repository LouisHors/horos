# 三分屏前端设计文档 V2

> 版本: v2.0  
> 日期: 2026-02-06  
> 关联: [系统总览](./SYSTEM_OVERVIEW_V2.md)

---

## 1. 设计概述

### 1.1 界面理念

三分屏设计的核心理念是**"信息分层，即时可见"**:

- **左上 (Agent Chat)**: 展示"谁在做什么" - 团队协作视图
- **左下 (Workflow Canvas)**: 展示"整体进度如何" - 执行规划视图  
- **右侧 (Project Explorer)**: 展示"产出了什么" - 成果物视图

### 1.2 布局架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              顶部导航栏 (56px)                               │
│  Logo | 项目选择 | 执行控制 [运行] [暂停] [重置] | 用户头像                    │
├───────────────────────────────────────┬─────────────────────────────────────┤
│                                       │                                     │
│  ┌─────────────────────────────────┐  │  ┌────────────────────────────────┐ │
│  │        Agent Chat Panel         │  │  │     Project Explorer           │ │
│  │         (40% height)            │  │  │                                │ │
│  ├─────────────────────────────────┤  │  │  📁 Project: Todo App          │ │
│  │                                 │  │  │  ├── 📄 PRD.md                 │ │
│  │  🤖 CTO    10:23               │  │  │  ├── 📄 Architecture.md        │ │
│  │  正在设计数据库架构...           │  │  │  ├── 📁 src/                   │ │
│  │                                 │  │  │  │   ├── 📁 components/         │ │
│  │  📝 产品经理 10:24              │  │  │  │   └── 📁 pages/              │ │
│  │  @CTO 用户需要支持协作功能       │  │  │  └── 📁 tests/                 │ │
│  │                                 │  │  │                                │ │
│  │  [____________________] [发送]  │  │  │  ┌─────────────────────────┐   │ │
│  └─────────────────────────────────┘  │  │  │ 📊 实时状态               │   │ │
│                                       │  │  │ 当前: FrontendDev 运行中  │   │ │
│  ┌─────────────────────────────────┐  │  │  │ 进度: 3/5 节点完成        │   │ │
│  │       Workflow Canvas           │  │  │  │ 耗时: 12m 34s            │   │ │
│  │         (60% height)            │  │  │  └─────────────────────────┘   │ │
│  ├─────────────────────────────────┤  │  │                                │ │
│  │                                 │  │  │  ┌─────────────────────────┐   │ │
│  │       ┌───┐                     │  │  │  │ ⚡ 操作按钮              │   │ │
│  │       │Start│───┐               │  │  │  │ [✓ 批准并执行]         │   │ │
│  │       └───┘   │                 │  │  │  │ [✎ 修改工作流]         │   │ │
│  │               ▼                 │  │  │  │ [⏹ 中断执行]           │   │ │
│  │       ┌───────────┐             │  │  │  └─────────────────────────┘   │ │
│  │       │ 🤖 CTO    │             │  │  │                                │ │
│  │       │ [运行中]  │             │  │  └────────────────────────────────┘ │
│  │       └─────┬─────┘             │  │                                     │
│  │             │                   │  │           (35% width)               │
│  │             ▼                   │  │                                     │
│  │       ┌───────────┐             │  │                                     │
│  │       │ 📝 PM     │             │  │                                     │
│  │       │ [已完成]  │             │  │                                     │
│  │       └───────────┘             │  │                                     │
│  │                                 │  │                                     │
│  └─────────────────────────────────┘  │                                     │
│                                       │                                     │
│           (65% width)                 │                                     │
└───────────────────────────────────────┴─────────────────────────────────────┘
```

### 1.3 响应式策略

| 屏幕宽度 | 布局调整 |
|---------|---------|
| > 1440px | 三分屏完整显示 |
| 1280-1440px | 右侧面板变窄 |
| 1024-1280px | 右侧面板可折叠 |
| < 1024px | 切换为标签页模式 |

---

## 2. 组件架构

### 2.1 整体组件树

```
App
├── TopNavigation
│   ├── Logo
│   ├── ProjectSelector
│   ├── ExecutionControls
│   └── UserMenu
│
├── MainLayout (SplitPane)
│   ├── LeftPanel (65%)
│   │   ├── SplitPane (vertical)
│   │   │   ├── AgentChatPanel (40%)
│   │   │   │   ├── AgentAvatarList
│   │   │   │   ├── MessageList (Virtualized)
│   │   │   │   │   └── MessageItem
│   │   │   │   │       ├── Avatar
│   │   │   │   │       ├── Content
│   │   │   │   │       └── Reactions
│   │   │   │   └── MessageInput
│   │   │   │       ├── TextArea
│   │   │   │       ├── MentionSelector
│   │   │   │       └── SendButton
│   │   │   │
│   │   │   └── WorkflowCanvas (60%)
│   │   │       ├── ReactFlow
│   │   │       │   ├── Background
│   │   │       │   ├── Controls
│   │   │       │   ├── MiniMap
│   │   │       │   ├── AgentNode
│   │   │       │   │   ├── NodeHeader (Avatar + Name + Status)
│   │   │       │   │   ├── NodeContent (Progress/Output)
│   │   │       │   │   └── NodeToolbar
│   │   │       │   └── ConnectionLine
│   │   │       └── ExecutionOverlay
│   │   │           ├── ProgressBar
│   │   │           └── StatusIndicators
│   │   │
│   └── RightPanel (35%)
│       ├── ProjectExplorer
│       │   ├── FileTree
│       │   │   └── FileTreeItem (recursive)
│       │   └── FileViewer (Code Editor)
│       ├── StatusPanel
│       │   ├── ExecutionProgress
│       │   ├── AgentStatusList
│       │   └── PerformanceMetrics
│       └── ActionPanel
│           ├── PrimaryActions
│           └── SecondaryActions
│
└── Modals
    ├── AgentDetailModal
    ├── FilePreviewModal
    └── SettingsModal
```

---

## 3. 左上面板: Agent Chat Panel

### 3.1 功能定位

展示 Agent 团队的实时协作对话，用户可:
- 查看所有 Agent 的发言
- @提及特定 Agent 进行询问
- 实时看到 Agent 的思考过程

### 3.2 组件设计

```typescript
// AgentAvatarList - 顶部头像列表
interface AgentAvatarListProps {
  agents: {
    id: string;
    name: string;
    avatar: string;
    role: string;
    status: 'idle' | 'working' | 'completed' | 'error';
  }[];
  onAgentClick: (agentId: string) => void;
}

// MessageList - 消息列表（虚拟滚动）
interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  onLoadMore: () => Promise<void>;
  onReply: (messageId: string) => void;
  onReaction: (messageId: string, emoji: string) => void;
}

// MessageItem - 单条消息
interface MessageItemProps {
  message: Message;
  isMe: boolean;
  showAvatar: boolean; // 连续消息不重复显示头像
  onMentionClick: (agentId: string) => void;
  onFileClick: (filePath: string) => void;
}
```

### 3.3 消息类型渲染

```tsx
// 普通聊天消息
const ChatMessage: React.FC<{ message: Message }> = ({ message }) => (
  <div className={`message ${message.sender.id === 'user' ? 'me' : 'agent'}`}>
    <Avatar src={message.sender.avatar} status={message.sender.status} />
    <div className="content">
      <div className="header">
        <span className="name">{message.sender.name}</span>
        <span className="time">{formatTime(message.metadata.timestamp)}</span>
      </div>
      <div className="text">
        <MentionHighlighter text={message.content.text} />
      </div>
      <MessageReactions reactions={message.metadata.reactions} />
    </div>
  </div>
);

// 文件变更消息
const FileMessage: React.FC<{ message: Message }> = ({ message }) => (
  <div className="message file-message">
    <FileIcon type={getFileType(message.content.file!.path)} />
    <div className="file-info">
      <div className="filename">{message.content.file!.path}</div>
      {message.content.file!.diff && (
        <DiffViewer diff={message.content.file!.diff} />
      )}
    </div>
  </div>
);

// 系统状态消息
const SystemMessage: React.FC<{ message: Message }> = ({ message }) => (
  <div className="message system-message">
    <StatusIcon status={message.content.status} />
    <span>{message.content.text}</span>
  </div>
);
```

### 3.4 输入框与@功能

```tsx
const MessageInput: React.FC = () => {
  const [text, setText] = useState('');
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentionList, setShowMentionList] = useState(false);
  
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setText(value);
    
    // 检测@触发
    const match = value.match(/@([\w]*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setShowMentionList(true);
    } else {
      setShowMentionList(false);
    }
  };
  
  const insertMention = (agent: Agent) => {
    const newText = text.replace(/@([\w]*)$/, `@${agent.name} `);
    setText(newText);
    setShowMentionList(false);
  };
  
  return (
    <div className="message-input">
      <textarea
        value={text}
        onChange={handleInput}
        placeholder="输入消息，使用 @ 提及Agent..."
        rows={3}
      />
      {showMentionList && (
        <MentionSelector
          query={mentionQuery}
          onSelect={insertMention}
        />
      )}
      <button onClick={sendMessage}>发送</button>
    </div>
  );
};
```

---

## 4. 左下面板: Workflow Canvas

### 4.1 功能定位

可视化展示工作流结构和执行进度，支持:
- AI 生成的工作流预览
- 用户手动编辑调整
- 实时执行状态反馈

### 4.2 自定义节点设计

```tsx
// AgentNode - Agent 执行节点
const AgentNode: React.FC<NodeProps<AgentNodeData>> = ({ data, selected }) => {
  const statusColors = {
    idle: '#94a3b8',
    running: '#3b82f6',
    completed: '#22c55e',
    error: '#ef4444',
    paused: '#f59e0b'
  };
  
  return (
    <div className={`agent-node ${selected ? 'selected' : ''}`}>
      {/* 状态指示器边框 */}
      <div 
        className="status-border"
        style={{ borderColor: statusColors[data.status] }}
      />
      
      {/* 节点头部 */}
      <div className="node-header">
        <span className="avatar">{data.roleIcon}</span>
        <span className="name">{data.roleName}</span>
        <StatusBadge status={data.status} />
      </div>
      
      {/* 节点内容 */}
      <div className="node-content">
        <div className="title">{data.taskTitle}</div>
        
        {data.status === 'running' && (
          <div className="progress">
            <ProgressBar percent={data.progress} />
            <span className="time">{data.elapsedTime}</span>
          </div>
        )}
        
        {data.status === 'completed' && data.output && (
          <div className="output-preview">
            {truncate(data.output.summary, 50)}
          </div>
        )}
      </div>
      
      {/* 操作按钮 */}
      <div className="node-toolbar">
        <button onClick={() => viewDetails(data.agentId)}>详情</button>
        {data.status === 'running' && (
          <button onClick={() => pauseAgent(data.agentId)}>暂停</button>
        )}
      </div>
      
      {/* 连接点 */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

// 节点样式 (Tailwind)
const agentNodeStyles = `
  .agent-node {
    @apply w-64 bg-white rounded-lg shadow-md overflow-hidden;
    @apply border-2 transition-all duration-300;
  }
  
  .agent-node.selected {
    @apply shadow-lg ring-2 ring-blue-500;
  }
  
  .agent-node .node-header {
    @apply flex items-center gap-2 px-3 py-2 bg-gray-50 border-b;
  }
  
  .agent-node .avatar {
    @apply text-2xl;
  }
  
  .agent-node .node-content {
    @apply p-3;
  }
  
  .agent-node .progress {
    @apply mt-2;
  }
`;
```

### 4.3 执行状态叠加层

```tsx
const ExecutionOverlay: React.FC = () => {
  const execution = useExecutionStore(state => state.currentExecution);
  
  if (!execution) return null;
  
  return (
    <div className="execution-overlay">
      {/* 总体进度条 */}
      <div className="global-progress">
        <div className="info">
          <span className="status">{execution.status}</span>
          <span className="count">
            {execution.completedNodes}/{execution.totalNodes} 完成
          </span>
        </div>
        <ProgressBar 
          percent={(execution.completedNodes / execution.totalNodes) * 100}
          animated={execution.status === 'running'}
        />
      </div>
      
      {/* 当前执行节点高亮 */}
      {execution.currentNodeId && (
        <NodeHighlighter nodeId={execution.currentNodeId} />
      )}
    </div>
  );
};
```

---

## 5. 右侧面板: Project Explorer

### 5.1 功能定位

展示项目文件结构，支持:
- 文件树浏览
- 代码查看和编辑
- 文件变更历史
- 实时状态指示

### 5.2 文件树组件

```tsx
interface FileTreeItemProps {
  item: FileNode;
  level: number;
  expanded: boolean;
  selected: boolean;
  onToggle: () => void;
  onSelect: () => void;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({
  item, level, expanded, selected, onToggle, onSelect
}) => {
  const isFolder = item.type === 'directory';
  const Icon = isFolder 
    ? (expanded ? FolderOpen : Folder)
    : getFileIcon(item.name);
  
  return (
    <div className="file-tree-item-wrapper">
      <div
        className={`file-tree-item ${selected ? 'selected' : ''}`}
        style={{ paddingLeft: level * 16 + 8 }}
        onClick={isFolder ? onToggle : onSelect}
      >
        {isFolder && (
          <ChevronRight 
            className={`chevron ${expanded ? 'expanded' : ''}`}
            size={16}
          />
        )}
        <Icon size={16} className="icon" />
        <span className="name">{item.name}</span>
        
        {/* 状态指示 */}
        {item.status && (
          <FileStatusBadge status={item.status} />
        )}
      </div>
      
      {/* 递归渲染子项 */}
      {isFolder && expanded && item.children?.map(child => (
        <FileTreeItem
          key={child.path}
          item={child}
          level={level + 1}
          {...childProps}
        />
      ))}
    </div>
  );
};
```

### 5.3 代码编辑器集成

```tsx
const FileViewer: React.FC = () => {
  const currentFile = useFileStore(state => state.currentFile);
  
  if (!currentFile) {
    return (
      <div className="empty-state">
        选择文件查看代码
      </div>
    );
  }
  
  return (
    <div className="file-viewer">
      <div className="file-header">
        <span className="filename">{currentFile.path}</span>
        <div className="actions">
          <button onClick={viewHistory}>历史</button>
          <button onClick={editFile}>编辑</button>
        </div>
      </div>
      
      <MonacoEditor
        value={currentFile.content}
        language={getLanguage(currentFile.path)}
        theme="vs-dark"
        options={{
          readOnly: !currentFile.isEditable,
          minimap: { enabled: false }
        }}
      />
    </div>
  );
};
```

### 5.4 状态面板

```tsx
const StatusPanel: React.FC = () => {
  const execution = useExecutionStore(state => state.currentExecution);
  const agents = useAgentStore(state => state.agents);
  
  return (
    <div className="status-panel">
      {/* 执行进度 */}
      <Section title="执行进度">
        <div className="execution-status">
          <StatusIcon status={execution?.status} />
          <span className="status-text">{execution?.status}</span>
          <span className="duration">{execution?.duration}</span>
        </div>
      </Section>
      
      {/* Agent 状态列表 */}
      <Section title="Agent 状态">
        {agents.map(agent => (
          <AgentStatusItem
            key={agent.id}
            name={agent.name}
            icon={agent.icon}
            status={agent.status}
            currentTask={agent.currentTask}
          />
        ))}
      </Section>
    </div>
  );
};
```

---

## 6. 状态管理

### 6.1 Zustand Store 设计

```typescript
// 根 Store
interface AppState {
  // 布局状态
  layout: {
    leftPanelWidth: number;
    chatPanelHeight: number;
    rightPanelCollapsed: boolean;
  };
  
  // 执行状态
  execution: {
    status: 'idle' | 'generating' | 'reviewing' | 'running' | 'completed' | 'error';
    currentWorkflow: Workflow | null;
    progress: ExecutionProgress;
  };
  
  // Agent 状态
  agents: Agent[];
  messages: Message[];
  
  // 文件状态
  files: FileNode[];
  currentFile: FileNode | null;
}

// 独立的 Slice Store
const useLayoutStore = create<LayoutState>((set) => ({
  leftPanelWidth: 65,
  chatPanelHeight: 40,
  rightPanelCollapsed: false,
  
  setLeftPanelWidth: (width) => set({ leftPanelWidth: width }),
  setChatPanelHeight: (height) => set({ chatPanelHeight: height }),
  toggleRightPanel: () => set(state => ({ 
    rightPanelCollapsed: !state.rightPanelCollapsed 
  }))
}));

const useExecutionStore = create<ExecutionState>((set, get) => ({
  status: 'idle',
  currentWorkflow: null,
  progress: { completed: 0, total: 0 },
  
  startGeneration: () => set({ status: 'generating' }),
  
  submitForReview: (workflow) => set({ 
    status: 'reviewing', 
    currentWorkflow: workflow 
  }),
  
  startExecution: () => set({ status: 'running' }),
  
  updateProgress: (progress) => set({ progress }),
  
  completeExecution: () => set({ status: 'completed' }),
  
  pauseExecution: () => {
    // 调用 API 暂停
    api.execution.pause();
    set({ status: 'paused' });
  }
}));

const useMessageStore = create<MessageState>((set, get) => ({
  messages: [],
  hasMore: true,
  
  addMessage: (message) => set(state => ({
    messages: [...state.messages, message]
  })),
  
  loadMore: async () => {
    const oldestId = get().messages[0]?.id;
    const more = await api.messages.getHistory({ before: oldestId });
    set(state => ({
      messages: [...more, ...state.messages],
      hasMore: more.length === 50
    }));
  },
  
  // WebSocket 消息处理
  handleRealtimeMessage: (message) => {
    get().addMessage(message);
    // 滚动到底部
    scrollToBottom();
  }
}));
```

---

## 7. 实时通信

### 7.1 WebSocket 管理

```typescript
class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  connect(projectId: string) {
    const wsUrl = `wss://api.example.com/ws/v2/projects/${projectId}`;
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
    
    this.ws.onclose = () => {
      this.attemptReconnect(projectId);
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }
  
  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'agent_message':
        useMessageStore.getState().handleRealtimeMessage(message.payload);
        break;
        
      case 'execution_progress':
        useExecutionStore.getState().updateProgress(message.payload);
        break;
        
      case 'file_change':
        useFileStore.getState().handleFileChange(message.payload);
        break;
        
      case 'agent_status_change':
        useAgentStore.getState().updateAgentStatus(message.payload);
        break;
    }
  }
  
  private attemptReconnect(projectId: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(projectId), 1000 * this.reconnectAttempts);
    }
  }
}
```

---

## 8. API 集成

```typescript
// API Client
const api = {
  // Master Agent
  master: {
    analyze: (text: string) => 
      axios.post('/api/v2/master/analyze', { text }),
    
    generate: (analysis: RequirementAnalysis) =>
      axios.post('/api/v2/master/plan', { analysis }),
    
    approve: (reviewQueueId: string) =>
      axios.post(`/api/v2/master/review/${reviewQueueId}/approve`),
    
    modify: (reviewQueueId: string, workflow: WorkflowDSL) =>
      axios.post(`/api/v2/master/review/${reviewQueueId}/modify`, { workflow })
  },
  
  // Execution
  execution: {
    start: (workflowId: string) =>
      axios.post(`/api/v2/execution/${workflowId}/start`),
    
    pause: () =>
      axios.post('/api/v2/execution/pause'),
    
    resume: () =>
      axios.post('/api/v2/execution/resume'),
    
    stop: () =>
      axios.post('/api/v2/execution/stop')
  },
  
  // Messages
  messages: {
    send: (groupId: string, content: string, mentions?: string[]) =>
      axios.post('/api/v2/messages', { groupId, content, mentions }),
    
    getHistory: (params: { groupId: string; before?: string; limit?: number }) =>
      axios.get('/api/v2/messages', { params })
  },
  
  // Files
  files: {
    getTree: (projectId: string) =>
      axios.get(`/api/v2/files/${projectId}/tree`),
    
    getContent: (path: string) =>
      axios.get(`/api/v2/files/${path}`),
    
    update: (path: string, content: string) =>
      axios.put(`/api/v2/files/${path}`, { content })
  }
};
```

---

## 9. 性能优化

### 9.1 虚拟滚动

```tsx
import { Virtuoso } from 'react-virtuoso';

const VirtualMessageList: React.FC = () => {
  const messages = useMessageStore(state => state.messages);
  
  return (
    <Virtuoso
      data={messages}
      itemContent={(index, message) => (
        <MessageItem 
          message={message}
          isMe={message.sender.id === 'user'}
        />
      )}
      followOutput="smooth" // 自动滚动到底部
      atBottomStateChange={(atBottom) => {
        // 如果用户手动滚动上去，暂停自动滚动
      }}
    />
  );
};
```

### 9.2 代码分割

```tsx
// 动态加载 Monaco Editor
const MonacoEditor = lazy(() => import('@monaco-editor/react'));

// 动态加载 Diff Viewer
const DiffViewer = lazy(() => import('./DiffViewer'));
```

---

**下一步**: 实现三分屏布局和核心组件。
