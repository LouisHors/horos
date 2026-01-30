# AI Agent 可视化编排工具 - 混合架构技术方案（融合版）

> 版本: v2.0  
> 日期: 2026年1月  
> 状态: 融合优化阶段  
> 融合参考: [agent-wechat](https://github.com/chmod777john/agent-wechat) 蜂群系统设计理念

---

## 目录

1. [架构演进思路](#1-架构演进思路)
2. [混合架构总览](#2-混合架构总览)
3. [核心设计理念](#3-核心设计理念)
4. [技术栈选型](#4-技术栈选型)
5. [数据模型设计](#5-数据模型设计)
6. [Agent运行时引擎](#6-agent运行时引擎)
7. [可视化编排系统](#7-可视化编排系统)
8. [消息总线与通信](#8-消息总线与通信)
9. [部署运维方案](#9-部署运维方案)
10. [开发路线图](#10-开发路线图)

---

## 1. 架构演进思路

### 1.1 两种架构模式对比

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        架构模式对比                                          │
├─────────────────────────────┬───────────────────────────────────────────────┤
│    中心化编排 (原方案)       │         去中心化蜂群 (agent-wechat)            │
├─────────────────────────────┼───────────────────────────────────────────────┤
│                             │                                               │
│  ┌─────────────┐            │  ┌─────────┐    ┌─────────┐    ┌─────────┐   │
│  │  Orchestrator│◄───────────┼──┤  User   │◄──►│  Agent  │◄──►│  Agent  │   │
│  │  (中央调度)  │            │  │(特殊Agent)│    │   A     │    │   B     │   │
│  └──────┬──────┘            │  └─────────┘    └────┬────┘    └─────────┘   │
│         │                   │                      │                        │
│    ┌────┴────┐              │              ┌───────┴───────┐                │
│    ▼         ▼              │              │   IM Group    │                │
│ ┌─────┐  ┌─────┐            │              │  (消息总线)   │                │
│ │Agent│  │Agent│            │              └───────────────┘                │
│ └─────┘  └─────┘            │                                               │
│                             │  • Agent自主运行 while(true)                  │
│  • 精确控制执行顺序          │  • 阻塞等待消息唤醒                            │
│  • 可视化调试友好            │  • 动态创建子Agent                            │
│  • 适合复杂业务流程          │  • 人机完全等价                                │
│                             │                                               │
└─────────────────────────────┴───────────────────────────────────────────────┘
```

### 1.2 混合架构设计哲学

**核心理念：编排层中心化 + 运行时去中心化**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        混合架构：取两者之长                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                     编排层 (中心化)                                  │  │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │  │
│   │  │ 画布编辑器   │  │ 工作流定义   │  │ 执行追踪器   │                 │  │
│   │  │ (ReactFlow) │  │ (DAG定义)   │  │ (可视化)    │                 │  │
│   │  └─────────────┘  └─────────────┘  └─────────────┘                 │  │
│   └───────────────────────────────┬─────────────────────────────────────┘  │
│                                   │                                         │
│                                   ▼                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                     运行时层 (去中心化)                              │  │
│   │                                                                     │  │
│   │   ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐      │  │
│   │   │  User   │◄───►│ Agent A │◄───►│ Agent B │◄───►│ Agent C │      │  │
│   │   │(人类Agent)│     │(Worker) │     │(Worker) │     │(Worker) │      │  │
│   │   └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘      │  │
│   │        │               │               │               │            │  │
│   │        └───────────────┴───────────────┴───────────────┘            │  │
│   │                        │                                            │  │
│   │                        ▼                                            │  │
│   │              ┌───────────────────┐                                  │  │
│   │              │   IM Message Bus  │                                  │  │
│   │              │  (Group/Message)  │                                  │  │
│   │              └───────────────────┘                                  │  │
│   │                                                                     │  │
│   │   每个Agent: while(true) {                                          │  │
│   │     1. 阻塞等待消息                                                  │  │
│   │     2. LLM推理（流式）                                               │  │
│   │     3. 执行工具/发送消息                                             │  │
│   │     4. 上下文持久化                                                  │  │
│   │   }                                                                 │  │
│   │                                                                     │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   优势:                                                                     │
│   • 编排层：可视化、可控、可追踪、支持复杂流程                              │
│   • 运行时：自组织、动态伸缩、人机协作自然                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 混合架构总览

### 2.1 系统分层架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              系统架构总览                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        表现层 (Presentation)                            │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │ │
│  │  │   Web UI     │  │   VS Code    │  │   Mobile     │                 │ │
│  │  │  (React)     │  │   插件       │  │   App        │                 │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                 │ │
│  └──────────────────────────────────┬─────────────────────────────────────┘ │
│                                     │                                       │
│  ┌──────────────────────────────────┼─────────────────────────────────────┐ │
│  │                        编排层 (Orchestration)                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │ │
│  │  │  画布编辑器   │  │  工作流引擎   │  │  执行追踪器   │                 │ │
│  │  │ (ReactFlow)  │  │  (DAG执行)   │  │ (实时状态)   │                 │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                 │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │ │
│  │  │  节点库      │  │  属性面板    │  │  调试器      │                 │ │
│  │  │(Agent/Tool) │  │(JSON Schema) │  │(断点/单步)  │                 │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                 │ │
│  └──────────────────────────────────┬─────────────────────────────────────┘ │
│                                     │                                       │
│  ┌──────────────────────────────────┼─────────────────────────────────────┐ │
│  │                        运行时层 (Runtime)                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │ │
│  │  │  Agent管理器  │  │  消息总线    │  │  状态机      │                 │ │
│  │  │(生命周期)   │  │(Group/Msg)  │  │(上下文)     │                 │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                 │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │ │
│  │  │  Agent运行时  │  │  工具市场    │  │  检查点      │                 │ │
│  │  │(while循环)  │  │(MCP协议)    │  │(故障恢复)   │                 │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                 │ │
│  └──────────────────────────────────┬─────────────────────────────────────┘ │
│                                     │                                       │
│  ┌──────────────────────────────────┼─────────────────────────────────────┐ │
│  │                        数据层 (Data)                                   │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │ │
│  │  │  PostgreSQL  │  │    Redis     │  │    MinIO     │                 │ │
│  │  │ (元数据)     │  │ (缓存/消息)  │  │(对象存储)   │                 │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                 │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        集成层 (Integration)                             │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │ │
│  │  │ LLM Provider │  │  MCP Tools   │  │  External    │                 │ │
│  │  │(OpenAI/etc) │  │(动态加载)   │  │    APIs      │                 │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                 │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 核心组件关系

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        核心组件数据流                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐                │
│   │   Canvas    │─────►│   Workflow  │─────►│   Agent     │                │
│   │  (可视化)   │      │   Engine    │      │   Manager   │                │
│   └─────────────┘      └──────┬──────┘      └──────┬──────┘                │
│                               │                    │                        │
│                               ▼                    ▼                        │
│                        ┌─────────────┐      ┌─────────────┐                │
│                        │   DAG定义   │      │  Agent池    │                │
│                        │(节点+边)   │      │(运行时实例) │                │
│                        └──────┬──────┘      └──────┬──────┘                │
│                               │                    │                        │
│                               └────────┬───────────┘                        │
│                                        │                                    │
│                                        ▼                                    │
│                              ┌───────────────────┐                          │
│                              │   Message Bus     │                          │
│                              │ (Group/Message)   │                          │
│                              └─────────┬─────────┘                          │
│                                        │                                    │
│                    ┌───────────────────┼───────────────────┐               │
│                    ▼                   ▼                   ▼               │
│              ┌───────────┐      ┌───────────┐      ┌───────────┐          │
│              │  Agent A  │      │  Agent B  │      │  Human    │          │
│              │ (Worker)  │      │ (Worker)  │      │ (User)    │          │
│              └───────────┘      └───────────┘      └───────────┘          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 核心设计理念

### 3.1 去中心化设计原则

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        去中心化核心原则                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. 用户和Agent完全等价                                                      │
│     ┌─────────────────────────────────────────────────────────────────┐    │
│     │  User  ──────►  Special Agent (role='human')                   │    │
│     │                                                                  │    │
│     │  • 可以像Agent一样接收消息                                        │    │
│     │  • 可以像Agent一样发送消息                                        │    │
│     │  • 可以加入任意Group                                              │    │
│     │  • 视角可切换（以任意Agent身份查看）                               │    │
│     └─────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  2. 所有通信通过IM系统                                                       │
│     ┌─────────────────────────────────────────────────────────────────┐    │
│     │  Agent A ──sendMessage()──► Group ──► Agent B (receive)        │    │
│     │                                                                  │    │
│     │  • P2P = 2人群                                                   │    │
│     │  • 群聊 = N人群                                                  │    │
│     │  • 消息持久化到messages表                                         │    │
│     │  • Agent通过getAllUnread()拉取                                   │    │
│     └─────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  3. Agent自运行生命周期                                                      │
│     ┌─────────────────────────────────────────────────────────────────┐    │
│     │  while (agent.status === 'running') {                          │    │
│     │    // 1. 检查未读消息                                             │    │
│     │    const unread = await getAllUnread(agent.id);                │    │
│     │    if (unread.length === 0) {                                  │    │
│     │      await waitForWake(agent.id); // 阻塞等待                   │    │
│     │      continue;                                                 │    │
│     │    }                                                           │    │
│     │                                                                │    │
│     │    // 2. 构建LLM上下文                                           │    │
│     │    const context = buildContext(agent.llm_history, unread);    │    │
│     │                                                                │    │
│     │    // 3. LLM推理（流式）                                         │    │
│     │    for await (const chunk of llm.stream(context)) {            │    │
│     │      emitToUI(agent.id, chunk); // 实时推送                     │    │
│     │    }                                                           │    │
│     │                                                                │    │
│     │    // 4. 处理工具调用                                            │    │
│     │    if (response.tool_calls) {                                  │    │
│     │      const results = await executeTools(response.tool_calls);  │    │
│     │      appendToContext(agent.id, results);                       │    │
│     │    }                                                           │    │
│     │                                                                │    │
│     │    // 5. 发送回复到Group                                         │    │
│     │    await sendMessage(groupId, agent.id, response.content);     │    │
│     │                                                                │    │
│     │    // 6. 持久化上下文                                            │    │
│     │    await saveContext(agent.id);                                │    │
│     │  }                                                             │    │
│     └─────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 编排与运行时分离

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        编排层 vs 运行时层                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │        编排层职责            │  │           运行时层职责               │  │
│  ├─────────────────────────────┤  ├─────────────────────────────────────┤  │
│  │                             │  │                                     │  │
│  │  • 工作流DAG定义             │  │  • Agent生命周期管理                │  │
│  │  • 节点类型注册              │  │  • 消息路由与分发                   │  │
│  │  • 画布可视化编辑            │  │  • LLM调用与流式输出                │  │
│  │  • 执行计划生成              │  │  • 工具执行（MCP）                  │  │
│  │  • 执行状态追踪              │  │  • 上下文管理                       │  │
│  │  • 断点调试支持              │  │  • 检查点持久化                     │  │
│  │                             │  │                                     │  │
│  │  输入: 用户拖拽配置          │  │  输入: 编排层生成的执行计划          │  │
│  │  输出: DAG定义 + 执行指令    │  │  输出: Agent执行结果 + 状态变更      │  │
│  │                             │  │                                     │  │
│  └─────────────────────────────┘  └─────────────────────────────────────┘  │
│                                                                             │
│  协作方式:                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  编排层 ──启动指令──► 运行时层                                      │   │
│  │     ▲                    │                                        │   │
│  │     │                    │ Agent状态变更                          │   │
│  │     │                    ▼                                        │   │
│  │  状态更新 ◄────────── 消息总线                                     │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. 技术栈选型

### 4.1 融合版技术栈

| 层级 | 组件 | 技术选型 | 选型理由 |
|-----|------|---------|---------|
| **运行时** | Runtime | Bun | 极致性能，与agent-wechat保持一致 |
| **后端框架** | API + UI | Next.js 16 (Route Handlers) | 全栈框架，前后端同构 |
| **数据库** | 主存储 | PostgreSQL 16 | 可靠，Drizzle ORM支持 |
| **ORM** | 数据访问 | Drizzle ORM | 类型安全，轻量级 |
| **缓存/消息** | Redis | Redis 7 + Redis Streams | 消息流支持 |
| **流式通信** | Realtime | Upstash Realtime / SSE | 流式状态推送 |
| **前端框架** | UI | React 19 + Next.js | 最新特性，性能优化 |
| **UI组件** | 组件库 | Tailwind CSS 4 + shadcn/ui | 现代化设计 |
| **动画** | 动效 | Framer Motion | 流畅交互 |
| **画布引擎** | 可视化 | ReactFlow 12 | 专业节点图编辑 |
| **状态管理** | 前端状态 | Zustand + Immer | 轻量，时间旅行 |
| **工具协议** | 工具集成 | MCP (Model Context Protocol) | 标准化工具调用 |

### 4.2 依赖配置

```json
// package.json
{
  "name": "agent-orchestration-platform",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    // Core
    "next": "^16.1.6",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    
    // Database
    "drizzle-orm": "^0.45.1",
    "postgres": "^3.4.8",
    "redis": "^4.7.0",
    
    // AI/LLM
    "@modelcontextprotocol/sdk": "^1.23.0",
    "ai": "^4.0.0",
    
    // Visualization
    "@xyflow/react": "^12.0.0",
    "reactflow": "^12.0.0",
    
    // UI
    "tailwindcss": "^4.1.18",
    "@tailwindcss/postcss": "^4.1.18",
    "framer-motion": "^11.2.10",
    "lucide-react": "^0.469.0",
    
    // State
    "zustand": "^4.4.0",
    "immer": "^10.0.0",
    
    // Utilities
    "zod": "^4.3.5",
    "uuid": "^9.0.0",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "drizzle-kit": "^0.30.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^16.0.0"
  }
}
```

---

## 5. 数据模型设计

### 5.1 核心数据模型

```typescript
// ==================== Workspace ====================
interface Workspace {
  id: string;           // UUID
  name: string;         // 工作空间名称
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;    // 创建者ID
}

// ==================== Agent 定义 ====================
interface AgentDefinition {
  id: string;
  workspaceId: string;
  
  // 基础信息
  name: string;
  role: string;         // 'coder', 'reviewer', 'planner', 'human', etc.
  description?: string;
  
  // 父子关系（支持动态创建子Agent）
  parentId?: string;    // 父Agent ID
  
  // LLM配置
  llmConfig: {
    provider: string;   // 'openai', 'anthropic', 'local'
    model: string;
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
  };
  
  // 工具配置
  tools: string[];      // 可用工具ID列表
  mcpServers?: string[]; // MCP服务器配置
  
  // 元数据
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// ==================== Agent 运行时实例 ====================
interface AgentInstance {
  id: string;
  definitionId: string;
  workspaceId: string;
  
  // 运行时状态
  status: 'idle' | 'running' | 'paused' | 'error' | 'terminated';
  
  // 私有上下文（与IM消息分离）
  llmHistory: LLMMessage[];  // 完整LLM对话历史
  
  // 当前活动
  currentGroupId?: string;   // 当前所在Group
  currentTask?: string;      // 当前执行任务
  
  // 统计
  tokenUsage: number;
  messageCount: number;
  
  createdAt: Date;
  lastActiveAt: Date;
}

type LLMMessage = 
  | { role: 'system' | 'user' | 'assistant'; content: string; tool_calls?: ToolCall[] }
  | { role: 'tool'; content: string; tool_call_id: string; name: string };

// ==================== IM 系统 ====================
// 核心设计：所有对话都是群，P2P = 2人群

interface Group {
  id: string;
  workspaceId: string;
  name?: string;           // 群名称（可选，P2P可为空）
  type: 'p2p' | 'group';   // P2P或群聊
  createdAt: Date;
}

interface GroupMember {
  groupId: string;
  agentId: string;         // Agent ID（用户也是特殊Agent）
  role: 'owner' | 'member';
  lastReadMessageId?: string;
  joinedAt: Date;
}

interface Message {
  id: string;              // UUID v7（可排序）
  workspaceId: string;
  groupId: string;
  senderId: string;        // 发送者Agent ID
  
  contentType: 'text' | 'image' | 'file' | 'tool_call' | 'tool_result';
  content: string;
  
  // 元数据
  metadata?: {
    toolCalls?: ToolCall[];
    thinking?: string;     // 推理过程
    tokens?: number;       // Token消耗
  };
  
  sendTime: Date;
}

// ==================== 工作流定义 ====================
interface WorkflowDefinition {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  
  // DAG定义
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  
  // 执行配置
  config: {
    maxConcurrency: number;
    timeout: number;
    retryPolicy: RetryPolicy;
  };
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface WorkflowNode {
  id: string;
  type: 'agent' | 'llm' | 'tool' | 'condition' | 'parallel' | 'human';
  position: { x: number; y: number };
  data: {
    agentId?: string;      // Agent节点引用
    toolId?: string;       // 工具节点引用
    condition?: string;    // 条件表达式
    config?: Record<string, any>;
  };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;      // 条件边
}

// ==================== 执行实例 ====================
interface ExecutionInstance {
  id: string;
  workflowId: string;
  workspaceId: string;
  
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  
  // 输入输出
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  
  // 节点执行状态
  nodeStates: Record<string, NodeExecutionState>;
  
  // 创建的相关Agent实例
  agentInstances: string[];
  
  // 时间戳
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  createdBy: string;
}

interface NodeExecutionState {
  nodeId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}
```

### 5.2 数据库Schema (Drizzle ORM)

```typescript
// db/schema.ts
import { 
  pgTable, 
  uuid, 
  text, 
  timestamp, 
  integer, 
  jsonb, 
  primaryKey,
  boolean,
  index
} from "drizzle-orm/pg-core";

// Workspaces
export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid("created_by").notNull(),
});

// Agent Definitions
export const agentDefinitions = pgTable("agent_definitions", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
  name: text("name").notNull(),
  role: text("role").notNull(),
  description: text("description"),
  parentId: uuid("parent_id").references(() => agentDefinitions.id),
  llmConfig: jsonb("llm_config").notNull(),
  tools: jsonb("tools").$type<string[]>().default([]),
  mcpServers: jsonb("mcp_servers"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid("created_by").notNull(),
}, (table) => ({
  workspaceIdx: index("agent_def_workspace_idx").on(table.workspaceId),
}));

// Agent Runtime Instances
export const agentInstances = pgTable("agent_instances", {
  id: uuid("id").primaryKey().defaultRandom(),
  definitionId: uuid("definition_id").notNull().references(() => agentDefinitions.id),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
  status: text("status").notNull().default('idle'),
  llmHistory: jsonb("llm_history").$type<LLMMessage[]>().default([]),
  currentGroupId: uuid("current_group_id"),
  currentTask: text("current_task"),
  tokenUsage: integer("token_usage").default(0),
  messageCount: integer("message_count").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  workspaceIdx: index("agent_inst_workspace_idx").on(table.workspaceId),
  statusIdx: index("agent_inst_status_idx").on(table.status),
}));

// IM Groups
export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
  name: text("name"),
  type: text("type").notNull().default('group'), // 'p2p' | 'group'
  contextTokens: integer("context_tokens").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Group Members
export const groupMembers = pgTable("group_members", {
  groupId: uuid("group_id").notNull().references(() => groups.id),
  agentId: uuid("agent_id").notNull(),
  role: text("role").notNull().default('member'), // 'owner' | 'member'
  lastReadMessageId: uuid("last_read_message_id"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.groupId, table.agentId] }),
  groupIdx: index("group_members_group_idx").on(table.groupId),
}));

// Messages
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
  groupId: uuid("group_id").notNull().references(() => groups.id),
  senderId: uuid("sender_id").notNull(),
  contentType: text("content_type").notNull(), // 'text' | 'image' | 'tool_call' | 'tool_result'
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  sendTime: timestamp("send_time", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  groupIdx: index("messages_group_idx").on(table.groupId),
  sendTimeIdx: index("messages_send_time_idx").on(table.sendTime),
}));

// Workflow Definitions
export const workflowDefinitions = pgTable("workflow_definitions", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
  name: text("name").notNull(),
  description: text("description"),
  nodes: jsonb("nodes").$type<WorkflowNode[]>().notNull(),
  edges: jsonb("edges").$type<WorkflowEdge[]>().notNull(),
  config: jsonb("config"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid("created_by").notNull(),
});

// Execution Instances
export const executionInstances = pgTable("execution_instances", {
  id: uuid("id").primaryKey().defaultRandom(),
  workflowId: uuid("workflow_id").notNull().references(() => workflowDefinitions.id),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
  status: text("status").notNull().default('pending'),
  inputs: jsonb("inputs"),
  outputs: jsonb("outputs"),
  nodeStates: jsonb("node_states"),
  agentInstances: jsonb("agent_instances").$type<string[]>(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid("created_by").notNull(),
}, (table) => ({
  workflowIdx: index("exec_workflow_idx").on(table.workflowId),
  statusIdx: index("exec_status_idx").on(table.status),
}));
```

---

## 6. Agent运行时引擎

### 6.1 Agent运行时核心

```typescript
// runtime/agent-runtime.ts
import { Redis } from 'ioredis';
import { db } from '@/db';
import { agentInstances, messages } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface AgentRuntimeConfig {
  agentId: string;
  llmConfig: LLMConfig;
  tools: Tool[];
  mcpRegistry: MCPRegistry;
}

class AgentRuntime {
  private agentId: string;
  private llm: LLMClient;
  private tools: Map<string, Tool>;
  private mcpRegistry: MCPRegistry;
  private redis: Redis;
  private status: 'idle' | 'running' | 'paused' | 'terminated' = 'idle';
  private currentGroupId?: string;
  
  constructor(config: AgentRuntimeConfig) {
    this.agentId = config.agentId;
    this.llm = createLLMClient(config.llmConfig);
    this.tools = new Map(config.tools.map(t => [t.name, t]));
    this.mcpRegistry = config.mcpRegistry;
    this.redis = new Redis(process.env.REDIS_URL!);
  }
  
  /**
   * Agent主循环 - 核心运行时
   * 设计参考: agent-wechat 的 while(true) 模式
   */
  async run(): Promise<void> {
    console.log(`[Agent ${this.agentId}] Starting runtime...`);
    this.status = 'running';
    
    // 恢复上下文
    await this.loadContext();
    
    while (this.status === 'running') {
      try {
        // 1. 检查未读消息
        const unreadMessages = await this.getAllUnread();
        
        if (unreadMessages.length === 0) {
          // 无消息，阻塞等待唤醒
          console.log(`[Agent ${this.agentId}] No unread messages, waiting...`);
          const wokeUp = await this.waitForWake(30000); // 30秒超时
          if (!wokeUp) continue;
        }
        
        // 2. 构建LLM上下文
        const context = await this.buildContext(unreadMessages);
        
        // 3. LLM推理（流式）
        const response = await this.runLLM(context);
        
        // 4. 处理响应
        await this.processResponse(response);
        
        // 5. 持久化上下文
        await this.saveContext();
        
      } catch (error) {
        console.error(`[Agent ${this.agentId}] Runtime error:`, error);
        await this.handleError(error);
      }
    }
    
    console.log(`[Agent ${this.agentId}] Runtime stopped`);
  }
  
  /**
   * 获取所有未读消息
   */
  private async getAllUnread(): Promise<Message[]> {
    const member = await db.query.groupMembers.findFirst({
      where: eq(groupMembers.agentId, this.agentId),
    });
    
    if (!member) return [];
    
    const unread = await db.query.messages.findMany({
      where: (messages, { and, eq, gt }) => and(
        eq(messages.groupId, member.groupId),
        gt(messages.id, member.lastReadMessageId || '00000000-0000-0000-0000-000000000000')
      ),
      orderBy: (messages, { asc }) => asc(messages.sendTime),
    });
    
    // 更新已读位置
    if (unread.length > 0) {
      const lastMessage = unread[unread.length - 1];
      await db.update(groupMembers)
        .set({ lastReadMessageId: lastMessage.id })
        .where(eq(groupMembers.agentId, this.agentId));
    }
    
    return unread;
  }
  
  /**
   * 阻塞等待唤醒信号
   */
  private async waitForWake(timeoutMs: number): Promise<boolean> {
    const channel = `agent:wake:${this.agentId}`;
    
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.redis.unsubscribe(channel);
        resolve(false);
      }, timeoutMs);
      
      this.redis.subscribe(channel, (err) => {
        if (err) {
          clearTimeout(timer);
          resolve(false);
        }
      });
      
      this.redis.on('message', (ch) => {
        if (ch === channel) {
          clearTimeout(timer);
          this.redis.unsubscribe(channel);
          resolve(true);
        }
      });
    });
  }
  
  /**
   * 构建LLM上下文
   */
  private async buildContext(newMessages: Message[]): Promise<LLMMessage[]> {
    // 获取Agent私有历史
    const agent = await db.query.agentInstances.findFirst({
      where: eq(agentInstances.id, this.agentId),
    });
    
    const history = agent?.llmHistory || [];
    
    // 将新消息转换为LLM消息格式
    const newLLMMessages: LLMMessage[] = newMessages.map(msg => ({
      role: msg.senderId === this.agentId ? 'assistant' : 'user',
      content: msg.content,
    }));
    
    return [...history, ...newLLMMessages];
  }
  
  /**
   * 运行LLM（流式输出）
   */
  private async runLLM(context: LLMMessage[]): Promise<LLMResponse> {
    const stream = await this.llm.stream({
      messages: context,
      tools: Array.from(this.tools.values()).map(t => t.definition),
    });
    
    let fullContent = '';
    let toolCalls: ToolCall[] = [];
    
    for await (const chunk of stream) {
      // 实时推送到UI
      await this.emitToUI({
        type: 'chunk',
        agentId: this.agentId,
        content: chunk.content,
        thinking: chunk.thinking,
      });
      
      fullContent += chunk.content || '';
      
      // 收集工具调用
      if (chunk.toolCalls) {
        toolCalls = [...toolCalls, ...chunk.toolCalls];
      }
    }
    
    return {
      content: fullContent,
      toolCalls,
      finishReason: toolCalls.length > 0 ? 'tool_calls' : 'stop',
    };
  }
  
  /**
   * 处理LLM响应
   */
  private async processResponse(response: LLMResponse): Promise<void> {
    // 1. 如果有工具调用，执行工具
    if (response.toolCalls && response.toolCalls.length > 0) {
      for (const toolCall of response.toolCalls) {
        const result = await this.executeTool(toolCall);
        
        // 将工具结果添加到上下文
        await this.appendToContext({
          role: 'tool',
          content: JSON.stringify(result),
          tool_call_id: toolCall.id,
          name: toolCall.name,
        });
      }
      
      // 工具执行后继续推理
      return this.run(await this.buildContext([]));
    }
    
    // 2. 发送回复到当前Group
    if (this.currentGroupId && response.content) {
      await this.sendMessage(this.currentGroupId, response.content);
    }
  }
  
  /**
   * 执行工具
   */
  private async executeTool(toolCall: ToolCall): Promise<any> {
    const tool = this.tools.get(toolCall.name);
    
    if (!tool) {
      throw new Error(`Tool not found: ${toolCall.name}`);
    }
    
    // 执行工具
    const args = JSON.parse(toolCall.arguments);
    const result = await tool.execute(args);
    
    // 发送工具调用消息到Group（可观测性）
    if (this.currentGroupId) {
      await this.sendMessage(this.currentGroupId, '', {
        toolCalls: [toolCall],
      });
    }
    
    return result;
  }
  
  /**
   * 发送消息到Group
   */
  private async sendMessage(
    groupId: string, 
    content: string,
    metadata?: MessageMetadata
  ): Promise<void> {
    const message = await db.insert(messages).values({
      workspaceId: (await this.getWorkspaceId()),
      groupId,
      senderId: this.agentId,
      contentType: metadata?.toolCalls ? 'tool_call' : 'text',
      content,
      metadata,
    }).returning();
    
    // 广播消息到新Channel
    await this.redis.publish(`group:${groupId}`, JSON.stringify({
      type: 'new_message',
      messageId: message[0].id,
      senderId: this.agentId,
    }));
    
    // 唤醒Group中的其他Agent
    await this.wakeGroupMembers(groupId);
  }
  
  /**
   * 唤醒Group中的所有成员
   */
  private async wakeGroupMembers(groupId: string): Promise<void> {
    const members = await db.query.groupMembers.findMany({
      where: eq(groupMembers.groupId, groupId),
    });
    
    for (const member of members) {
      if (member.agentId !== this.agentId) {
        await this.redis.publish(`agent:wake:${member.agentId}`, 'wake');
      }
    }
  }
  
  /**
   * 加载上下文
   */
  private async loadContext(): Promise<void> {
    // 从数据库恢复
    const agent = await db.query.agentInstances.findFirst({
      where: eq(agentInstances.id, this.agentId),
    });
    
    if (agent) {
      this.currentGroupId = agent.currentGroupId || undefined;
    }
  }
  
  /**
   * 保存上下文
   */
  private async saveContext(): Promise<void> {
    const agent = await db.query.agentInstances.findFirst({
      where: eq(agentInstances.id, this.agentId),
    });
    
    if (agent) {
      await db.update(agentInstances)
        .set({
          llmHistory: agent.llmHistory,
          lastActiveAt: new Date(),
        })
        .where(eq(agentInstances.id, this.agentId));
    }
  }
  
  /**
   * 添加消息到上下文
   */
  private async appendToContext(message: LLMMessage): Promise<void> {
    const agent = await db.query.agentInstances.findFirst({
      where: eq(agentInstances.id, this.agentId),
    });
    
    if (agent) {
      agent.llmHistory.push(message);
    }
  }
  
  /**
   * 实时推送到UI
   */
  private async emitToUI(event: UIEvent): Promise<void> {
    await this.redis.publish(`agent:ui:${this.agentId}`, JSON.stringify(event));
  }
  
  /**
   * 处理错误
   */
  private async handleError(error: Error): Promise<void> {
    await db.update(agentInstances)
      .set({ status: 'error' })
      .where(eq(agentInstances.id, this.agentId));
    
    this.status = 'paused';
  }
  
  // 公共方法
  pause(): void { this.status = 'paused'; }
  resume(): void { this.status = 'running'; }
  terminate(): void { this.status = 'terminated'; }
  getStatus(): string { return this.status; }
}
```

### 6.2 Agent管理器

```typescript
// runtime/agent-manager.ts
import { AgentRuntime } from './agent-runtime';
import { MCPRegistry } from './mcp';

class AgentManager {
  private agents: Map<string, AgentRuntime> = new Map();
  private mcpRegistry: MCPRegistry;
  
  constructor() {
    this.mcpRegistry = new MCPRegistry();
  }
  
  /**
   * 创建并启动Agent
   */
  async spawnAgent(definitionId: string): Promise<string> {
    // 1. 从定义创建实例
    const definition = await db.query.agentDefinitions.findFirst({
      where: eq(agentDefinitions.id, definitionId),
    });
    
    if (!definition) {
      throw new Error(`Agent definition not found: ${definitionId}`);
    }
    
    // 2. 创建运行时实例记录
    const instance = await db.insert(agentInstances).values({
      definitionId,
      workspaceId: definition.workspaceId,
      status: 'idle',
      llmHistory: [{
        role: 'system',
        content: definition.llmConfig.systemPrompt,
      }],
    }).returning();
    
    const instanceId = instance[0].id;
    
    // 3. 加载工具
    const tools = await this.loadTools(definition.tools);
    
    // 4. 创建运行时
    const runtime = new AgentRuntime({
      agentId: instanceId,
      llmConfig: definition.llmConfig,
      tools,
      mcpRegistry: this.mcpRegistry,
    });
    
    this.agents.set(instanceId, runtime);
    
    // 5. 启动运行时（异步）
    runtime.run().catch(console.error);
    
    return instanceId;
  }
  
  /**
   * 动态创建子Agent
   */
  async spawnChildAgent(
    parentId: string,
    role: string,
    guidance?: string
  ): Promise<string> {
    const parent = await db.query.agentInstances.findFirst({
      where: eq(agentInstances.id, parentId),
    });
    
    if (!parent) {
      throw new Error(`Parent agent not found: ${parentId}`);
    }
    
    const parentDef = await db.query.agentDefinitions.findFirst({
      where: eq(agentDefinitions.id, parent.definitionId),
    });
    
    // 创建子Agent定义（继承父Agent配置）
    const childDef = await db.insert(agentDefinitions).values({
      workspaceId: parent.workspaceId,
      name: `${parentDef?.name}_${role}_${Date.now()}`,
      role,
      parentId,
      llmConfig: {
        ...parentDef!.llmConfig,
        systemPrompt: `${parentDef!.llmConfig.systemPrompt}\n\n${guidance || ''}`,
      },
      tools: parentDef!.tools,
    }).returning();
    
    // 启动子Agent
    return this.spawnAgent(childDef[0].id);
  }
  
  /**
   * 停止Agent
   */
  async terminateAgent(agentId: string): Promise<void> {
    const runtime = this.agents.get(agentId);
    if (runtime) {
      runtime.terminate();
      this.agents.delete(agentId);
    }
    
    await db.update(agentInstances)
      .set({ status: 'terminated' })
      .where(eq(agentInstances.id, agentId));
  }
  
  /**
   * 唤醒Agent
   */
  async wakeAgent(agentId: string): Promise<void> {
    const runtime = this.agents.get(agentId);
    if (runtime && runtime.getStatus() === 'idle') {
      const redis = new Redis(process.env.REDIS_URL!);
      await redis.publish(`agent:wake:${agentId}`, 'wake');
    }
  }
  
  /**
   * 获取Agent状态
   */
  getAgentStatus(agentId: string): string {
    return this.agents.get(agentId)?.getStatus() || 'unknown';
  }
  
  private async loadTools(toolIds: string[]): Promise<Tool[]> {
    // 加载内置工具 + MCP工具
    const tools: Tool[] = [];
    
    for (const toolId of toolIds) {
      const tool = await this.mcpRegistry.getTool(toolId);
      if (tool) tools.push(tool);
    }
    
    return tools;
  }
}

export const agentManager = new AgentManager();
```

---

## 7. 可视化编排系统

### 7.1 画布编辑器架构

```typescript
// components/FlowEditor/index.tsx
'use client';

import React, { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useFlowStore } from '@/stores/flowStore';
import { NodeLibrary } from './NodeLibrary';
import { PropertiesPanel } from './PropertiesPanel';
import { Toolbar } from './Toolbar';
import { AgentNode } from './nodes/AgentNode';
import { ToolNode } from './nodes/ToolNode';
import { ConditionNode } from './nodes/ConditionNode';

const nodeTypes = {
  agent: AgentNode,
  tool: ToolNode,
  condition: ConditionNode,
  llm: LLMNode,
  human: HumanNode,
  start: StartNode,
  end: EndNode,
};

export function FlowEditor() {
  const { nodes, edges, onNodesChange, onEdgesChange, selectedNode } = useFlowStore();
  
  const onConnect = useCallback(
    (connection: Connection) => {
      const edge = addEdge(connection, edges);
      onEdgesChange(edge);
    },
    [edges, onEdgesChange]
  );
  
  return (
    <div className="flex h-screen w-full">
      {/* 左侧节点库 */}
      <NodeLibrary />
      
      {/* 中间画布 */}
      <div className="flex-1 relative">
        <Toolbar />
        
        <ReactFlow
          nodes={nodes}
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
      
      {/* 右侧属性面板 */}
      <PropertiesPanel selectedNode={selectedNode} />
    </div>
  );
}
```

### 7.2 状态管理 (Zustand)

```typescript
// stores/flowStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Node, Edge } from '@xyflow/react';

interface FlowState {
  // 画布状态
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  
  // 历史记录（撤销重做）
  history: { nodes: Node[]; edges: Edge[] }[];
  historyIndex: number;
  
  // 执行状态
  executionStatus: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  nodeExecutionStates: Record<string, NodeExecutionState>;
  
  // Actions
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  addNode: (node: Node) => void;
  updateNode: (id: string, data: any) => void;
  removeNode: (id: string) => void;
  setSelectedNode: (node: Node | null) => void;
  undo: () => void;
  redo: () => void;
  
  // 执行相关
  startExecution: () => void;
  pauseExecution: () => void;
  resumeExecution: () => void;
  stopExecution: () => void;
  updateNodeExecutionState: (nodeId: string, state: NodeExecutionState) => void;
}

export const useFlowStore = create<FlowState>()(
  immer((set, get) => ({
    nodes: [],
    edges: [],
    selectedNode: null,
    history: [],
    historyIndex: -1,
    executionStatus: 'idle',
    nodeExecutionStates: {},
    
    onNodesChange: (changes) => {
      set((state) => {
        state.nodes = applyNodeChanges(changes, state.nodes);
      });
    },
    
    onEdgesChange: (changes) => {
      set((state) => {
        state.edges = applyEdgeChanges(changes, state.edges);
      });
    },
    
    addNode: (node) => {
      set((state) => {
        state.nodes.push(node);
        state._saveToHistory();
      });
    },
    
    updateNode: (id, data) => {
      set((state) => {
        const node = state.nodes.find(n => n.id === id);
        if (node) {
          node.data = { ...node.data, ...data };
        }
        state._saveToHistory();
      });
    },
    
    removeNode: (id) => {
      set((state) => {
        state.nodes = state.nodes.filter(n => n.id !== id);
        state.edges = state.edges.filter(e => e.source !== id && e.target !== id);
        state._saveToHistory();
      });
    },
    
    setSelectedNode: (node) => {
      set({ selectedNode: node });
    },
    
    undo: () => {
      const { history, historyIndex } = get();
      if (historyIndex > 0) {
        const prev = history[historyIndex - 1];
        set((state) => {
          state.nodes = prev.nodes;
          state.edges = prev.edges;
          state.historyIndex = historyIndex - 1;
        });
      }
    },
    
    redo: () => {
      const { history, historyIndex } = get();
      if (historyIndex < history.length - 1) {
        const next = history[historyIndex + 1];
        set((state) => {
          state.nodes = next.nodes;
          state.edges = next.edges;
          state.historyIndex = historyIndex + 1;
        });
      }
    },
    
    _saveToHistory: () => {
      const { nodes, edges, history, historyIndex } = get();
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({ 
        nodes: JSON.parse(JSON.stringify(nodes)), 
        edges: JSON.parse(JSON.stringify(edges)) 
      });
      set((state) => {
        state.history = newHistory;
        state.historyIndex = newHistory.length - 1;
      });
    },
    
    // 执行相关
    startExecution: () => set({ executionStatus: 'running' }),
    pauseExecution: () => set({ executionStatus: 'paused' }),
    resumeExecution: () => set({ executionStatus: 'running' }),
    stopExecution: () => set({ executionStatus: 'idle', nodeExecutionStates: {} }),
    
    updateNodeExecutionState: (nodeId, state) => {
      set((draft) => {
        draft.nodeExecutionStates[nodeId] = state;
      });
    },
  }))
);
```

### 7.3 自定义Agent节点

```typescript
// components/FlowEditor/nodes/AgentNode.tsx
'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Bot, Play, Pause, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface AgentNodeData {
  label: string;
  agentId?: string;
  role?: string;
  status?: 'idle' | 'running' | 'completed' | 'error';
  model?: string;
  tools?: string[];
}

export const AgentNode = memo(({ data, selected }: NodeProps<AgentNodeData>) => {
  const statusColors = {
    idle: 'border-gray-300',
    running: 'border-blue-500 animate-pulse',
    completed: 'border-green-500',
    error: 'border-red-500',
  };
  
  const StatusIcon = {
    idle: Bot,
    running: Play,
    completed: Check,
    error: X,
  }[data.status || 'idle'];
  
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`
        min-w-[180px] bg-white rounded-lg shadow-lg border-2 
        ${statusColors[data.status || 'idle']}
        ${selected ? 'ring-2 ring-blue-400' : ''}
      `}
    >
      {/* 输入连接点 */}
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      {/* 节点头部 */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-t-lg border-b">
        <StatusIcon className={`w-4 h-4 ${
          data.status === 'running' ? 'text-blue-500' : 'text-gray-600'
        }`} />
        <span className="font-medium text-sm truncate">{data.label}</span>
      </div>
      
      {/* 节点内容 */}
      <div className="px-3 py-2 space-y-1">
        {data.role && (
          <div className="text-xs text-gray-500">
            Role: <span className="text-gray-700">{data.role}</span>
          </div>
        )}
        {data.model && (
          <div className="text-xs text-gray-500">
            Model: <span className="text-gray-700">{data.model}</span>
          </div>
        )}
        {data.tools && data.tools.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">Tools:</span>
            <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
              {data.tools.length}
            </span>
          </div>
        )}
      </div>
      
      {/* 输出连接点 */}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </motion.div>
  );
});

AgentNode.displayName = 'AgentNode';
```

---

## 8. 消息总线与通信

### 8.1 消息总线架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        消息总线架构                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     Redis Streams (消息总线)                         │   │
│  │                                                                     │   │
│  │  Stream: group:{groupId}    - 群消息流                             │   │
│  │  Stream: agent:{agentId}    - Agent私有消息                         │   │
│  │  Pub/Sub: agent:wake:{id}   - 唤醒信号                              │   │
│  │  Pub/Sub: agent:ui:{id}     - UI实时推送                            │   │
│  │                                                                     │   │
│  └─────────────────────────────────────┬───────────────────────────────┘   │
│                                        │                                    │
│  ┌─────────────────────────────────────┼───────────────────────────────┐   │
│  │                                     │                               │   │
│  │  ┌─────────────┐  ┌─────────────┐  │  ┌─────────────┐             │   │
│  │  │   Agent A   │  │   Agent B   │◄─┘  │    Human    │             │   │
│  │  │  (Runtime)  │  │  (Runtime)  │     │   (User)    │             │   │
│  │  └──────┬──────┘  └──────┬──────┘     └──────┬──────┘             │   │
│  │         │                │                   │                     │   │
│  │         └────────────────┴───────────────────┘                     │   │
│  │                          │                                         │   │
│  │                          ▼                                         │   │
│  │              ┌─────────────────────┐                               │   │
│  │              │   PostgreSQL        │                               │   │
│  │              │  (messages表持久化)  │                               │   │
│  │              └─────────────────────┘                               │   │
│  │                                                                    │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 消息服务

```typescript
// lib/message-service.ts
import { Redis } from 'ioredis';
import { db } from '@/db';
import { messages, groupMembers } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

class MessageService {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
  }
  
  /**
   * 发送消息到Group
   */
  async sendMessage(params: {
    workspaceId: string;
    groupId: string;
    senderId: string;
    content: string;
    contentType?: string;
    metadata?: any;
  }): Promise<Message> {
    // 1. 持久化到数据库
    const [message] = await db.insert(messages).values({
      workspaceId: params.workspaceId,
      groupId: params.groupId,
      senderId: params.senderId,
      contentType: params.contentType || 'text',
      content: params.content,
      metadata: params.metadata,
    }).returning();
    
    // 2. 发布到Redis Stream
    await this.redis.xadd(
      `group:${params.groupId}`,
      '*', // 自动生成ID
      'messageId', message.id,
      'senderId', params.senderId,
      'content', params.content,
      'contentType', params.contentType || 'text'
    );
    
    // 3. 广播新消息事件
    await this.redis.publish(`group:${params.groupId}:events`, JSON.stringify({
      type: 'new_message',
      messageId: message.id,
      senderId: params.senderId,
    }));
    
    // 4. 唤醒Group中的其他Agent
    await this.wakeGroupMembers(params.groupId, params.senderId);
    
    return message;
  }
  
  /**
   * 获取未读消息
   */
  async getUnreadMessages(agentId: string, groupId: string): Promise<Message[]> {
    // 获取最后读取位置
    const member = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.agentId, agentId),
        eq(groupMembers.groupId, groupId)
      ),
    });
    
    const lastReadId = member?.lastReadMessageId || '00000000-0000-0000-0000-000000000000';
    
    // 查询未读消息
    const unread = await db.query.messages.findMany({
      where: and(
        eq(messages.groupId, groupId),
        gt(messages.id, lastReadId)
      ),
      orderBy: (messages, { asc }) => asc(messages.sendTime),
    });
    
    return unread;
  }
  
  /**
   * 标记已读
   */
  async markAsRead(agentId: string, groupId: string, messageId: string): Promise<void> {
    await db.update(groupMembers)
      .set({ lastReadMessageId: messageId })
      .where(and(
        eq(groupMembers.agentId, agentId),
        eq(groupMembers.groupId, groupId)
      ));
  }
  
  /**
   * 唤醒Group中的成员
   */
  private async wakeGroupMembers(groupId: string, excludeSenderId: string): Promise<void> {
    const members = await db.query.groupMembers.findMany({
      where: eq(groupMembers.groupId, groupId),
    });
    
    for (const member of members) {
      if (member.agentId !== excludeSenderId) {
        await this.redis.publish(`agent:wake:${member.agentId}`, JSON.stringify({
          type: 'new_message',
          groupId,
        }));
      }
    }
  }
  
  /**
   * 订阅Group消息（实时）
   */
  async subscribeGroup(
    groupId: string,
    callback: (message: Message) => void
  ): Promise<() => void> {
    const subscriber = new Redis(process.env.REDIS_URL!);
    
    await subscriber.subscribe(`group:${groupId}:events`);
    
    subscriber.on('message', async (channel, message) => {
      const event = JSON.parse(message);
      if (event.type === 'new_message') {
        const msg = await db.query.messages.findFirst({
          where: eq(messages.id, event.messageId),
        });
        if (msg) callback(msg);
      }
    });
    
    // 返回取消订阅函数
    return () => {
      subscriber.unsubscribe(`group:${groupId}:events`);
      subscriber.disconnect();
    };
  }
  
  /**
   * 创建P2P Group
   */
  async createP2PGroup(
    workspaceId: string,
    agentAId: string,
    agentBId: string
  ): Promise<string> {
    // 创建Group
    const [group] = await db.insert(groups).values({
      workspaceId,
      type: 'p2p',
    }).returning();
    
    // 添加成员
    await db.insert(groupMembers).values([
      { groupId: group.id, agentId: agentAId, role: 'member' },
      { groupId: group.id, agentId: agentBId, role: 'member' },
    ]);
    
    return group.id;
  }
  
  /**
   * 创建多人群组
   */
  async createGroup(
    workspaceId: string,
    name: string,
    agentIds: string[]
  ): Promise<string> {
    const [group] = await db.insert(groups).values({
      workspaceId,
      name,
      type: 'group',
    }).returning();
    
    await db.insert(groupMembers).values(
      agentIds.map((agentId, index) => ({
        groupId: group.id,
        agentId,
        role: index === 0 ? 'owner' : 'member' as const,
      }))
    );
    
    return group.id;
  }
}

export const messageService = new MessageService();
```

---

## 9. 部署运维方案

### 9.1 Docker Compose (开发环境)

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/agent_platform
      - REDIS_URL=redis://redis:6379
      - NODE_ENV=development
    depends_on:
      - postgres
      - redis
    volumes:
      - .:/app
      - /app/node_modules
    command: bun dev

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=agent_platform
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 9.2 Dockerfile

```dockerfile
# Dockerfile
FROM oven/bun:1 AS base

WORKDIR /app

# 安装依赖
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# 复制源码
COPY . .

# 生成数据库类型
RUN bun run db:generate

# 构建
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# 生产环境
FROM oven/bun:1-slim AS production

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 复制构建产物
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "server.js"]
```

---

## 10. 开发路线图

### 10.1 阶段规划

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          开发路线图                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Phase 1: 基础架构 (3周)                                                    │
│  ├── 项目脚手架 + Next.js 16 + Bun                                          │
│  ├── Drizzle ORM + PostgreSQL + Redis                                       │
│  └── 数据库Schema + 基础API                                                 │
│                                                                             │
│  Phase 2: Agent运行时 (4周)                                                 │
│  ├── AgentRuntime (while循环 + 阻塞等待)                                    │
│  ├── AgentManager (生命周期管理)                                            │
│  ├── 消息总线 (Group/Message)                                               │
│  └── MCP工具集成                                                            │
│                                                                             │
│  Phase 3: 可视化编辑器 (4周)                                                │
│  ├── ReactFlow画布 + 基础节点                                               │
│  ├── 节点库 + 属性面板                                                      │
│  ├── 撤销重做 + 导入导出                                                    │
│  └── 执行状态可视化                                                         │
│                                                                             │
│  Phase 4: 编排引擎 (3周)                                                    │
│  ├── DAG执行引擎                                                            │
│  ├── 工作流解析器                                                           │
│  └── 检查点 + 故障恢复                                                      │
│                                                                             │
│  Phase 5: 高级功能 (3周)                                                    │
│  ├── 条件分支 + 并行执行                                                    │
│  ├── 子图嵌套 + 动态创建Agent                                               │
│  └── 人机协作 + 实时流式                                                    │
│                                                                             │
│  Phase 6: 部署优化 (2周)                                                    │
│  ├── Docker + K8s                                                           │
│  ├── 监控 + 日志                                                            │
│  └── 性能优化                                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 里程碑

| 里程碑 | 时间 | 交付物 |
|-------|------|-------|
| **M1** | 第3周 | 基础架构完成，数据库就绪 |
| **M2** | 第7周 | Agent运行时可用，支持自运行 |
| **M3** | 第11周 | 可视化编辑器可用，支持拖拽编排 |
| **M4** | 第14周 | 编排引擎可用，支持工作流执行 |
| **M5** | 第17周 | 高级功能完成，支持动态Agent创建 |
| **M6** | 第19周 | 生产就绪，完整文档 |

---

## 总结

本方案融合了 **agent-wechat 的去中心化蜂群设计** 和 **传统可视化编排的优势**：

### 核心创新点

1. **编排层中心化 + 运行时去中心化**
   - 画布提供可视化控制和追踪
   - Agent运行时自主循环，阻塞等待消息

2. **IM消息总线**
   - 所有通信通过Group/Message
   - P2P = 2人群，自然支持多Agent群聊
   - 唤醒机制避免轮询

3. **人机完全等价**
   - 用户是特殊Agent (role='human')
   - 可切换视角观察任意Agent
   - 随时介入对话

4. **流式状态展示**
   - 实时显示Agent思考过程
   - 工具调用可视化
   - 执行状态追踪

### 参考来源

- [agent-wechat](https://github.com/chmod777john/agent-wechat) - 蜂群系统设计理念
- [ReactFlow](https://reactflow.dev/) - 可视化画布
- [Drizzle ORM](https://orm.drizzle.team/) - 类型安全数据库访问
- [MCP](https://modelcontextprotocol.io/) - 工具集成协议
