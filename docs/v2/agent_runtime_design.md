# Agent Runtime 详细设计文档

> 版本: v2.0  
> 日期: 2026-02-06  
> 关联: [系统总览](./SYSTEM_OVERVIEW_V2.md), [Master Agent](./master_agent_design.md)

---

## 1. 概述

### 1.1 设计目标

Agent Runtime 是系统的执行核心，负责:
- 管理 Agent 生命周期（创建、运行、暂停、恢复、销毁）
- 提供 Agent 间通信机制（IM消息总线）
- 维护 Agent 执行状态和上下文
- 支持自驱动模式（while true）和人工干预

### 1.2 核心特性

| 特性 | 说明 |
|------|------|
| **自驱动** | Agent 运行在自己的事件循环中，主动获取任务和消息 |
| **消息驱动** | 通过消息总线进行协作，支持@提及和群聊 |
| **状态持久** | 状态可保存到检查点，支持故障恢复 |
| **人机协作** | 用户可随时介入，修改上下文或打断执行 |
| **生命周期管理** | 完整的创建、初始化、运行、暂停、恢复、销毁流程 |

### 1.3 架构位置

```
Master Agent (规划)
        │
        ▼ 创建工作流 + Agent实例
┌─────────────────────────────┐
│       Agent Runtime         │
│  ┌─────────┐ ┌──────────┐  │
│  │ Agent-1 │ │ Agent-2  │  │
│  │ (CTO)   │ │ (PM)     │  │
│  │ while() │ │ while()  │  │
│  └────┬────┘ └────┬─────┘  │
│       │           │        │
│       └─────┬─────┘        │
│             ▼              │
│  ┌──────────────────────┐  │
│  │   Message Bus        │  │
│  │   (IM消息总线)        │  │
│  └──────────────────────┘  │
└─────────────────────────────┘
        │
        ▼ 执行具体任务
Execution Engine
```

---

## 2. 核心概念

### 2.1 Agent 状态机

```
                    ┌─────────────┐
        ┌──────────▶│   IDLE      │◀──────────┐
        │  分配任务 │  (空闲)     │           │
        │           └──────┬──────┘           │
        │                  │ 接收任务          │
        │                  ▼                  │
        │           ┌─────────────┐           │
        │    ┌──────│  RUNNING    │──────┐    │
        │    │      │  (执行中)   │      │    │
        │    │      └──────┬──────┘      │    │
        │    │             │             │    │
   任务完成   │      用户暂停 │      错误   │    恢复
        │    │             │             │    │
        │    ▼             ▼             ▼    │
        │  ┌────┐     ┌─────────┐   ┌───────┐ │
        └──│DONE│     │ PAUSED  │   │ ERROR │─┘
           └────┘     │(已暂停) │   └───────┘
                      └────┬────┘      │
                           │            │
                           └────────────┘
                              用户干预
```

### 2.2 消息类型

```typescript
interface Message {
  id: string;
  groupId: string;        // 所属群组 (项目级/任务级)
  
  sender: {
    id: string;           // Agent ID 或 'user'
    name: string;
    role: string;         // 'CTO' | 'PM' | 'user' | 'system'
    avatar?: string;
  };
  
  type: 'chat' | 'task' | 'system' | 'file' | 'code';
  
  content: {
    text: string;         // 消息文本
    mentions?: string[];  // @提及的Agent ID列表
    replyTo?: string;     // 回复的消息ID
    
    // type=file 时的附加信息
    file?: {
      path: string;
      content?: string;
      diff?: string;      // 代码变更diff
    };
    
    // type=task 时的附加信息
    task?: {
      id: string;
      action: 'assign' | 'complete' | 'block' | 'help';
      description: string;
    };
  };
  
  metadata: {
    timestamp: Date;
    editedAt?: Date;
    readBy: string[];     // 已读的Agent ID
    reactions: Reaction[]; // 表情反应
  };
}

interface Reaction {
  agentId: string;
  emoji: string;          // 👍 | 👎 | ✅ | ❓ | 🎉
}
```

### 2.3 上下文管理

```typescript
interface AgentContext {
  // 会话上下文
  session: {
    history: Message[];        // 最近N条消息
    variables: Map<string, any>; // 临时变量
  };
  
  // 任务上下文
  task: {
    current?: Task;
    backlog: Task[];           // 待办任务
    completed: Task[];         // 已完成任务
  };
  
  // 文件上下文
  files: {
    workingDir: string;
    openFiles: string[];       // 当前打开的文件
    modifiedFiles: string[];   // 修改过的文件
  };
  
  // LLM 上下文
  llm: {
    systemPrompt: string;
    temperature: number;
    maxTokens: number;
  };
}
```

---

## 3. 核心组件

### 3.1 Agent 类

```typescript
class Agent {
  readonly id: string;
  readonly role: RoleTemplate;
  
  private runtime: AgentRuntime;
  private state: AgentState = 'idle';
  private context: AgentContext;
  private abortController: AbortController;
  
  constructor(config: AgentConfig) {
    this.id = config.id;
    this.role = config.role;
    this.runtime = config.runtime;
    this.context = this.initContext();
  }
  
  // ========== 生命周期方法 ==========
  
  /**
   * 启动 Agent 主循环
   */
  async start(): Promise<void> {
    console.log(`[Agent ${this.id}] 启动`);
    this.state = 'running';
    this.abortController = new AbortController();
    
    // 注册到消息总线
    await this.runtime.messageBus.subscribe(this.id, this.onMessage.bind(this));
    
    // 主循环
    while (this.state !== 'terminated' && !this.abortController.signal.aborted) {
      try {
        await this.mainLoopIteration();
      } catch (error) {
        console.error(`[Agent ${this.id}] 循环错误:`, error);
        await this.handleError(error);
      }
    }
    
    console.log(`[Agent ${this.id}] 停止`);
  }
  
  /**
   * 单次循环迭代
   */
  private async mainLoopIteration(): Promise<void> {
    // 1. 检查是否有新消息
    const unreadMessages = await this.runtime.messageBus.getUnread(this.id);
    
    for (const message of unreadMessages) {
      await this.processMessage(message);
    }
    
    // 2. 检查当前任务状态
    if (this.context.task.current) {
      await this.continueTask(this.context.task.current);
      return; // 有任务时先不接收新任务
    }
    
    // 3. 从任务队列获取新任务
    const newTask = await this.runtime.taskQueue.dequeue(this.id);
    if (newTask) {
      await this.startTask(newTask);
      return;
    }
    
    // 4. 空闲等待
    await this.waitForEvent(5000); // 5秒超时
  }
  
  /**
   * 暂停执行
   */
  async pause(): Promise<void> {
    if (this.state === 'running') {
      this.state = 'paused';
      // 保存当前状态到检查点
      await this.runtime.checkpoint.save(this.id, this.context);
      console.log(`[Agent ${this.id}] 已暂停`);
    }
  }
  
  /**
   * 恢复执行
   */
  async resume(): Promise<void> {
    if (this.state === 'paused') {
      // 从检查点恢复
      const saved = await this.runtime.checkpoint.load(this.id);
      if (saved) {
        this.context = saved.context;
      }
      this.state = 'running';
      console.log(`[Agent ${this.id}] 已恢复`);
    }
  }
  
  /**
   * 终止 Agent
   */
  async terminate(): Promise<void> {
    this.state = 'terminated';
    this.abortController.abort();
    await this.runtime.messageBus.unsubscribe(this.id);
    console.log(`[Agent ${this.id}] 已终止`);
  }
  
  // ========== 消息处理 ==========
  
  /**
   * 处理收到的消息
   */
  private async processMessage(message: Message): Promise<void> {
    console.log(`[Agent ${this.id}] 收到消息:`, message.content.text.slice(0, 50));
    
    // 更新会话历史
    this.context.session.history.push(message);
    
    // 检查是否@自己
    const isMentioned = message.content.mentions?.includes(this.id);
    
    // 根据消息类型处理
    switch (message.type) {
      case 'chat':
        if (isMentioned || this.shouldRespond(message)) {
          await this.handleChat(message);
        }
        break;
        
      case 'task':
        if (message.content.task?.action === 'assign') {
          await this.handleTaskAssignment(message);
        }
        break;
        
      case 'system':
        await this.handleSystemMessage(message);
        break;
        
      case 'file':
        await this.handleFileChange(message);
        break;
    }
  }
  
  /**
   * 处理群聊消息
   */
  private async handleChat(message: Message): Promise<void> {
    // 使用 LLM 生成回复
    const response = await this.generateResponse(message);
    
    // 发送回复
    await this.runtime.messageBus.send(message.groupId, {
      sender: { id: this.id, name: this.role.name, role: this.role.type },
      type: 'chat',
      content: { text: response },
      metadata: { timestamp: new Date(), readBy: [], reactions: [] }
    });
  }
  
  /**
   * 判断是否应响应（未被@时）
   */
  private shouldRespond(message: Message): boolean {
    // 如果话题与自己的能力相关
    const relevant = this.role.capabilities.some(cap => 
      message.content.text.toLowerCase().includes(cap.toLowerCase())
    );
    
    // 如果@了其他Agent，不抢答
    const mentionsOthers = message.content.mentions && 
      message.content.mentions.length > 0 &&
      !message.content.mentions.includes(this.id);
    
    return relevant && !mentionsOthers;
  }
  
  // ========== 任务执行 ==========
  
  /**
   * 开始执行任务
   */
  private async startTask(task: Task): Promise<void> {
    console.log(`[Agent ${this.id}] 开始任务:`, task.title);
    this.context.task.current = task;
    
    // 在群聊中报告
    await this.reportToGroup('start', task);
    
    try {
      // 执行任务
      const result = await this.executeTask(task);
      
      // 标记完成
      task.status = 'completed';
      task.result = result;
      this.context.task.completed.push(task);
      
      await this.reportToGroup('complete', task, result);
      
    } catch (error) {
      task.status = 'failed';
      task.error = error;
      await this.reportToGroup('error', task, error);
    } finally {
      this.context.task.current = undefined;
    }
  }
  
  /**
   * 执行任务（由子类实现或动态调度）
   */
  private async executeTask(task: Task): Promise<any> {
    // 根据任务类型选择执行器
    switch (task.type) {
      case 'code_generation':
        return await this.executeCodeGeneration(task);
      case 'code_review':
        return await this.executeCodeReview(task);
      case 'architecture_design':
        return await this.executeArchitectureDesign(task);
      case 'document_writing':
        return await this.executeDocumentWriting(task);
      default:
        // 使用 LLM 通用执行
        return await this.executeWithLLM(task);
    }
  }
  
  /**
   * 使用 LLM 执行任务
   */
  private async executeWithLLM(task: Task): Promise<string> {
    const messages: LLMMessage[] = [
      { role: 'system', content: this.role.systemPrompt },
      ...this.context.session.history.slice(-10).map(m => ({
        role: m.sender.id === this.id ? 'assistant' : 'user',
        content: `[${m.sender.name}]: ${m.content.text}`
      })),
      { role: 'user', content: `任务: ${task.description}\n\n请完成此任务。` }
    ];
    
    const response = await this.runtime.llmService.chat(messages, {
      temperature: this.context.llm.temperature,
      maxTokens: this.context.llm.maxTokens
    });
    
    return response.content;
  }
  
  // ========== 工具方法 ==========
  
  /**
   * 等待事件（消息或任务）
   */
  private async waitForEvent(timeoutMs: number): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(resolve, timeoutMs);
      
      // 如果有新消息或任务，提前唤醒
      const unsubscribe = this.runtime.eventBus.on('newMessage', () => {
        clearTimeout(timer);
        unsubscribe();
        resolve();
      });
    });
  }
  
  /**
   * 向群组报告状态
   */
  private async reportToGroup(
    type: 'start' | 'progress' | 'complete' | 'error',
    task: Task,
    data?: any
  ): Promise<void> {
    const messages = {
      start: `🔛 开始执行任务: ${task.title}`,
      progress: `⏳ 任务进度: ${task.title} - ${data}%`,
      complete: `✅ 完成任务: ${task.title}`,
      error: `❌ 任务失败: ${task.title} - ${data?.message}`
    };
    
    await this.runtime.messageBus.send(task.groupId, {
      sender: { id: this.id, name: this.role.name, role: 'system' },
      type: 'system',
      content: { text: messages[type] },
      metadata: { timestamp: new Date(), readBy: [], reactions: [] }
    });
  }
}
```

---

### 3.2 MessageBus (消息总线)

```typescript
interface IMessageBus {
  // 订阅群组消息
  subscribe(agentId: string, handler: MessageHandler): Promise<void>;
  unsubscribe(agentId: string): Promise<void>;
  
  // 发送消息
  send(groupId: string, message: Omit<Message, 'id' | 'groupId'>): Promise<void>;
  
  // 获取未读消息
  getUnread(agentId: string): Promise<Message[]>;
  markAsRead(agentId: string, messageIds: string[]): Promise<void>;
  
  // 获取历史消息
  getHistory(groupId: string, options: {
    limit?: number;
    before?: Date;
    after?: Date;
  }): Promise<Message[]>;
  
  // 等待新消息（阻塞）
  waitForMessage(agentId: string, timeoutMs: number): Promise<Message | null>;
}

type MessageHandler = (message: Message) => void | Promise<void>;

class RedisMessageBus implements IMessageBus {
  private redis: Redis;
  private subscribers: Map<string, MessageHandler> = new Map();
  private pubSub: Redis; // 独立的 Pub/Sub 连接
  
  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
    this.pubSub = new Redis(redisUrl);
    
    // 监听消息频道
    this.pubSub.on('message', (channel, message) => {
      const data = JSON.parse(message);
      const handler = this.subscribers.get(data.agentId);
      if (handler) {
        handler(data.message);
      }
    });
  }
  
  async subscribe(agentId: string, handler: MessageHandler): Promise<void> {
    this.subscribers.set(agentId, handler);
    await this.pubSub.subscribe(`agent:${agentId}`);
  }
  
  async unsubscribe(agentId: string): Promise<void> {
    this.subscribers.delete(agentId);
    await this.pubSub.unsubscribe(`agent:${agentId}`);
  }
  
  async send(groupId: string, message: Omit<Message, 'id' | 'groupId'>): Promise<void> {
    const fullMessage: Message = {
      id: generateUUID(),
      groupId,
      ...message
    } as Message;
    
    // 1. 保存到 Stream（持久化）
    await this.redis.xadd(
      `stream:group:${groupId}`,
      '*', // 自动生成ID
      'message',
      JSON.stringify(fullMessage)
    );
    
    // 2. 记录未读状态
    const groupMembers = await this.redis.smembers(`group:${groupId}:members`);
    for (const memberId of groupMembers) {
      if (memberId !== fullMessage.sender.id) {
        await this.redis.zadd(
          `agent:${memberId}:unread`,
          Date.now(),
          fullMessage.id
        );
      }
    }
    
    // 3. 实时推送给在线成员
    for (const memberId of groupMembers) {
      await this.redis.publish(`agent:${memberId}`, JSON.stringify({
        agentId: memberId,
        message: fullMessage
      }));
    }
  }
  
  async getUnread(agentId: string): Promise<Message[]> {
    // 从 Sorted Set 获取未读消息ID
    const messageIds = await this.redis.zrange(`agent:${agentId}:unread`, 0, -1);
    
    if (messageIds.length === 0) return [];
    
    // 从 Stream 获取完整消息
    const messages: Message[] = [];
    for (const id of messageIds) {
      // 这里简化处理，实际应该从 Stream 读取
      const data = await this.redis.get(`message:${id}`);
      if (data) {
        messages.push(JSON.parse(data));
      }
    }
    
    return messages;
  }
  
  async markAsRead(agentId: string, messageIds: string[]): Promise<void> {
    await this.redis.zrem(`agent:${agentId}:unread`, ...messageIds);
  }
  
  async getHistory(
    groupId: string,
    options: { limit?: number; before?: Date; after?: Date }
  ): Promise<Message[]> {
    const { limit = 50, before, after } = options;
    
    // 从 Stream 读取历史
    const streams = await this.redis.xrevrange(
      `stream:group:${groupId}`,
      before ? `${before.getTime()}-0` : '+',
      after ? `${after.getTime()}-0` : '-',
      'COUNT',
      limit
    );
    
    return streams.map(([id, fields]) => {
      const messageData = fields[1]; // fields = ['message', '{...}']
      return JSON.parse(messageData);
    });
  }
}
```

---

### 3.3 StateManager (状态管理)

```typescript
interface StateManager {
  // 保存 Agent 状态
  save(agentId: string, context: AgentContext): Promise<void>;
  
  // 加载 Agent 状态
  load(agentId: string): Promise<AgentContext | null>;
  
  // 创建检查点
  checkpoint(agentId: string, label: string): Promise<string>; // 返回checkpointId
  
  // 恢复到检查点
  restore(checkpointId: string): Promise<AgentContext>;
  
  // 列出检查点
  listCheckpoints(agentId: string): Promise<CheckpointInfo[]>;
}

class RedisStateManager implements StateManager {
  private redis: Redis;
  
  async save(agentId: string, context: AgentContext): Promise<void> {
    // 序列化上下文（使用 MessagePack 或 JSON）
    const serialized = serialize(context);
    
    // 保存到 Redis
    await this.redis.setex(
      `agent:${agentId}:state`,
      3600, // 1小时过期
      serialized
    );
  }
  
  async load(agentId: string): Promise<AgentContext | null> {
    const data = await this.redis.get(`agent:${agentId}:state`);
    if (!data) return null;
    return deserialize(data);
  }
  
  async checkpoint(agentId: string, label: string): Promise<string> {
    const checkpointId = generateUUID();
    const context = await this.load(agentId);
    
    if (!context) {
      throw new Error(`No state to checkpoint for agent ${agentId}`);
    }
    
    const checkpoint: Checkpoint = {
      id: checkpointId,
      agentId,
      label,
      context,
      createdAt: new Date()
    };
    
    // 保存到 MinIO（大对象存储）
    await minioClient.putObject(
      'checkpoints',
      `${agentId}/${checkpointId}.msgpack`,
      Buffer.from(serialize(checkpoint))
    );
    
    // 记录元数据到 Redis
    await this.redis.zadd(
      `agent:${agentId}:checkpoints`,
      Date.now(),
      JSON.stringify({
        id: checkpointId,
        label,
        createdAt: checkpoint.createdAt
      })
    );
    
    return checkpointId;
  }
  
  async restore(checkpointId: string): Promise<AgentContext> {
    // 从 MinIO 读取
    const data = await minioClient.getObject('checkpoints', checkpointId);
    const checkpoint: Checkpoint = deserialize(data);
    
    return checkpoint.context;
  }
}
```

---

## 4. 数据模型

### 4.1 数据库表

```sql
-- Agent 实例表
CREATE TABLE agent_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  role_type VARCHAR(50) NOT NULL, -- CTO/PM/FRONTEND_DEV/...
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(10),
  status VARCHAR(20) NOT NULL DEFAULT 'idle', -- idle/running/paused/terminated
  
  -- 上下文引用（存储在 Redis/MinIO）
  state_key VARCHAR(200),
  
  -- 运行时配置
  config JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 消息表（使用 TimescaleDB 或分区）
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id VARCHAR(100) NOT NULL, -- project:{id} 或 task:{id}
  
  sender_id VARCHAR(100) NOT NULL, -- agent_id 或 'user'
  sender_name VARCHAR(100),
  sender_role VARCHAR(50),
  
  type VARCHAR(20) NOT NULL, -- chat/task/system/file
  content_text TEXT NOT NULL,
  content_metadata JSONB DEFAULT '{}',
  
  mentions UUID[], -- @提及的Agent
  reply_to UUID, -- 回复的消息
  
  read_by UUID[] DEFAULT '{}',
  reactions JSONB DEFAULT '[]',
  
  created_at TIMESTAMP DEFAULT NOW(),
  edited_at TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_messages_group_id ON messages(group_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- 检查点表
CREATE TABLE checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agent_instances(id),
  label VARCHAR(200),
  
  -- 存储路径（实际数据在 MinIO）
  storage_path VARCHAR(500) NOT NULL,
  size_bytes INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 任务队列表
CREATE TABLE task_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  
  title VARCHAR(200) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  priority INTEGER DEFAULT 0,
  
  assigned_to UUID REFERENCES agent_instances(id),
  status VARCHAR(20) DEFAULT 'pending', -- pending/running/completed/failed
  
  dependencies UUID[], -- 依赖的任务ID
  
  result JSONB,
  error TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);
```

---

## 5. API 接口

```typescript
// Agent 管理
POST   /api/v2/agents                    // 创建 Agent
GET    /api/v2/agents/:projectId         // 获取项目所有 Agent
GET    /api/v2/agents/:id                // 获取 Agent 详情
POST   /api/v2/agents/:id/start          // 启动 Agent
POST   /api/v2/agents/:id/pause          // 暂停 Agent
POST   /api/v2/agents/:id/resume         // 恢复 Agent
POST   /api/v2/agents/:id/terminate      // 终止 Agent
DELETE /api/v2/agents/:id                // 删除 Agent

// 消息
POST   /api/v2/messages                  // 发送消息
GET    /api/v2/messages/:groupId         // 获取群聊历史
GET    /api/v2/messages/unread/:agentId  // 获取未读消息
POST   /api/v2/messages/read             // 标记已读

// 检查点
POST   /api/v2/checkpoints               // 创建检查点
GET    /api/v2/checkpoints/:agentId      // 列出检查点
POST   /api/v2/checkpoints/:id/restore   // 恢复到检查点

// WebSocket 实时通信
WS     /ws/v2/agents/:agentId            // Agent 实时消息流
WS     /ws/v2/groups/:groupId            // 群组实时消息流
```

---

## 6. 人机协作机制

### 6.1 用户介入方式

| 方式 | 场景 | 实现 |
|------|------|------|
| **@提及** | 询问特定 Agent | 消息中@AgentID，Agent必响应 |
| **打断执行** | 纠正错误方向 | 暂停Agent，修改上下文，恢复 |
| **修改文件** | 调整代码实现 | 文件变更事件通知相关Agent |
| **任务重分配** | 调整分工 | 将任务从AgentA转移到AgentB |
| **强制决策** | 技术选型等 | Agent提出选项，用户选择 |

### 6.2 打断与恢复流程

```
用户发现问题
    │
    ▼
点击"暂停执行"
    │
    ▼
┌─────────────────┐
│ 1. 发送暂停信号  │
│ 2. 保存检查点    │
│ 3. Agent进入PAUSED│
└─────────────────┘
    │
    ▼
用户修改（文件/上下文/任务）
    │
    ▼
点击"恢复执行"
    │
    ▼
┌─────────────────┐
│ 1. 加载新上下文  │
│ 2. Agent恢复RUNNING│
│ 3. 继续执行      │
└─────────────────┘
```

---

**下一步**: 实现 AgentRuntime 核心类和 MessageBus。
