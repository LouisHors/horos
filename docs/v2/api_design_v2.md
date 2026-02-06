# API 接口设计文档 V2

> 版本: v2.0  
> 日期: 2026-02-06  
> 关联: [系统总览](./SYSTEM_OVERVIEW_V2.md)

---

## 1. API 概览

### 1.1 基础信息

| 项目 | 值 |
|------|---|
| **Base URL** | `https://api.horos.dev/api/v2` |
| **WebSocket** | `wss://api.horos.dev/ws/v2` |
| **认证方式** | Bearer Token (JWT) |
| **数据格式** | JSON |
| **字符编码** | UTF-8 |

### 1.2 响应格式

```typescript
// 标准响应结构
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    pagination?: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
}

// 示例成功响应
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-02-06T12:00:00Z",
    "requestId": "req_abc123"
  }
}

// 示例错误响应
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  },
  "meta": {
    "timestamp": "2026-02-06T12:00:00Z",
    "requestId": "req_abc123"
  }
}
```

### 1.3 错误码

| HTTP Status | Error Code | 说明 |
|------------|------------|------|
| 400 | `VALIDATION_ERROR` | 参数校验失败 |
| 401 | `UNAUTHORIZED` | 未认证或Token过期 |
| 403 | `FORBIDDEN` | 无权限访问 |
| 404 | `NOT_FOUND` | 资源不存在 |
| 409 | `CONFLICT` | 资源冲突（如重复创建） |
| 422 | `BUSINESS_ERROR` | 业务逻辑错误 |
| 429 | `RATE_LIMITED` | 请求过于频繁 |
| 500 | `INTERNAL_ERROR` | 服务器内部错误 |

---

## 2. Master Agent API

### 2.1 分析需求

```http
POST /master/analyze
```

**描述**: 解析用户的自然语言需求

**请求体**:
```json
{
  "text": "开发一个支持多人协作的 Todo App",
  "context": {
    "projectType": "webapp",
    "techStack": ["React", "Node.js"]
  }
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "analysis": {
      "rawText": "开发一个支持多人协作的 Todo App",
      "taskType": "webapp",
      "features": [
        { "id": "f1", "description": "任务CRUD", "priority": "must", "category": "core" },
        { "id": "f2", "description": "多人实时协作", "priority": "must", "category": "core" },
        { "id": "f3", "description": "任务分配", "priority": "should", "category": "ui" }
      ],
      "constraints": [
        { "type": "tech", "description": "使用React技术栈" }
      ],
      "complexity": "medium",
      "estimatedEffort": {
        "duration": "2-3周",
        "storyPoints": 34
      },
      "suggestedRoles": ["CTO", "PRODUCT_MANAGER", "FRONTEND_DEV", "BACKEND_DEV"],
      "ambiguousPoints": ["协作是指实时同步还是手动刷新？"]
    }
  }
}
```

### 2.2 生成执行计划

```http
POST /master/plan
```

**描述**: 根据需求分析生成完整执行计划

**请求体**:
```json
{
  "analysis": {
    "rawText": "开发一个支持多人协作的 Todo App",
    "taskType": "webapp",
    "features": [...],
    "complexity": "medium"
  }
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "reviewQueueId": "rq_abc123",
    "roles": [
      {
        "instanceId": "agent_cto_001",
        "role": {
          "id": "role_cto",
          "name": "CTO",
          "icon": "🤖",
          "type": "CTO"
        },
        "assignedTasks": ["t1", "t2"],
        "executionOrder": 0,
        "canParallel": false,
        "dependencies": []
      },
      {
        "instanceId": "agent_pm_001",
        "role": {
          "id": "role_pm",
          "name": "产品经理",
          "icon": "📝",
          "type": "PRODUCT_MANAGER"
        },
        "assignedTasks": ["t3"],
        "executionOrder": 0,
        "canParallel": true,
        "dependencies": []
      }
    ],
    "tasks": {
      "tasks": [
        {
          "id": "t1",
          "title": "设计系统架构",
          "description": "设计Todo App的整体架构...",
          "assignedTo": "agent_cto_001",
          "type": "architecture_design",
          "priority": "high",
          "estimatedDuration": 120,
          "dependencies": [],
          "inputs": [],
          "outputs": [{"type": "file", "path": "Architecture.md"}]
        }
      ],
      "edges": [
        { "from": "t1", "to": "t2", "type": "dependency" }
      ],
      "parallelGroups": [["t3"], ["t1", "t4"]],
      "criticalPath": ["t1", "t2", "t5"]
    },
    "workflow": {
      "nodes": [
        {
          "id": "start",
          "type": "start",
          "position": { "x": 250, "y": 50 },
          "data": { "label": "开始" }
        },
        {
          "id": "t1",
          "type": "agent",
          "position": { "x": 250, "y": 200 },
          "data": {
            "label": "🤖 CTO - 设计系统架构",
            "role": "CTO",
            "agentId": "agent_cto_001",
            "taskId": "t1"
          }
        }
      ],
      "edges": [
        { "id": "e1", "source": "start", "target": "t1" }
      ],
      "viewport": { "x": 0, "y": 0, "zoom": 1 },
      "metadata": {
        "name": "Todo App 开发工作流",
        "description": "支持多人协作的Todo App",
        "generatedAt": "2026-02-06T12:00:00Z",
        "generatedBy": "master_agent"
      }
    }
  }
}
```

### 2.3 获取审核队列

```http
GET /master/review-queue/:reviewQueueId
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "rq_abc123",
    "status": "pending",
    "requirementText": "开发一个支持多人协作的 Todo App",
    "requirementAnalysis": { ... },
    "generatedWorkflow": { ... },
    "generatedRoles": [ ... ],
    "generatedTasks": { ... },
    "createdAt": "2026-02-06T12:00:00Z"
  }
}
```

### 2.4 批准执行

```http
POST /master/review-queue/:reviewQueueId/approve
```

**描述**: 用户审核通过，开始执行

**响应**:
```json
{
  "success": true,
  "data": {
    "executionId": "exec_def456",
    "message": "Execution started successfully",
    "agents": [
      { "id": "agent_cto_001", "status": "initializing" },
      { "id": "agent_pm_001", "status": "initializing" }
    ]
  }
}
```

### 2.5 拒绝执行

```http
POST /master/review-queue/:reviewQueueId/reject
```

**请求体**:
```json
{
  "feedback": "需要增加移动端适配的功能"
}
```

### 2.6 修改后提交

```http
POST /master/review-queue/:reviewQueueId/modify
```

**请求体**:
```json
{
  "modifiedWorkflow": {
    "nodes": [ ... ],
    "edges": [ ... ]
  },
  "feedback": "调整了执行顺序"
}
```

---

## 3. Agent API

### 3.1 创建 Agent

```http
POST /agents
```

**请求体**:
```json
{
  "projectId": "proj_123",
  "roleTemplateId": "CTO",
  "name": "首席架构师"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "agent_cto_002",
    "projectId": "proj_123",
    "roleTemplateId": "CTO",
    "name": "首席架构师",
    "icon": "🤖",
    "status": "idle",
    "createdAt": "2026-02-06T12:00:00Z"
  }
}
```

### 3.2 获取项目 Agent 列表

```http
GET /agents?projectId=proj_123
```

**查询参数**:
- `projectId` (required): 项目ID
- `status` (optional): 状态过滤
- `role` (optional): 角色过滤

**响应**:
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "id": "agent_cto_001",
        "name": "CTO",
        "roleTemplateId": "CTO",
        "icon": "🤖",
        "status": "running",
        "currentTask": {
          "id": "t1",
          "title": "设计系统架构",
          "progress": 45
        },
        "stats": {
          "tasksCompleted": 5,
          "tasksFailed": 0,
          "messagesSent": 23
        }
      }
    ]
  }
}
```

### 3.3 获取 Agent 详情

```http
GET /agents/:agentId
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "agent_cto_001",
    "projectId": "proj_123",
    "roleTemplateId": "CTO",
    "name": "CTO",
    "icon": "🤖",
    "status": "running",
    "currentTask": { ... },
    "taskQueue": [ ... ],
    "stats": { ... },
    "createdAt": "2026-02-06T12:00:00Z",
    "updatedAt": "2026-02-06T14:30:00Z"
  }
}
```

### 3.4 启动 Agent

```http
POST /agents/:agentId/start
```

**响应**:
```json
{
  "success": true,
  "data": {
    "status": "running",
    "startedAt": "2026-02-06T14:30:00Z"
  }
}
```

### 3.5 暂停 Agent

```http
POST /agents/:agentId/pause
```

### 3.6 恢复 Agent

```http
POST /agents/:agentId/resume
```

### 3.7 终止 Agent

```http
POST /agents/:agentId/terminate
```

---

## 4. Message API

### 4.1 发送消息

```http
POST /messages
```

**请求体**:
```json
{
  "groupId": "project:proj_123",
  "type": "chat",
  "content": {
    "text": "@agent_cto_001 请考虑使用 WebSocket 实现实时同步",
    "mentions": ["agent_cto_001"]
  }
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "msg_abc123",
    "groupId": "project:proj_123",
    "sender": {
      "id": "user_123",
      "name": "用户",
      "role": "user"
    },
    "type": "chat",
    "content": {
      "text": "@agent_cto_001 请考虑使用 WebSocket 实现实时同步",
      "mentions": ["agent_cto_001"]
    },
    "createdAt": "2026-02-06T14:30:00Z"
  }
}
```

### 4.2 获取群聊历史

```http
GET /messages?groupId=project:proj_123&limit=50&before=msg_xxx
```

**查询参数**:
- `groupId` (required): 群组ID
- `limit` (optional): 返回数量，默认50，最大100
- `before` (optional): 获取此消息之前的历史
- `after` (optional): 获取此消息之后的新消息

**响应**:
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg_001",
        "groupId": "project:proj_123",
        "sender": {
          "id": "agent_cto_001",
          "name": "CTO",
          "role": "CTO"
        },
        "type": "chat",
        "content": {
          "text": "正在设计数据库模型..."
        },
        "readBy": ["user_123"],
        "reactions": [],
        "createdAt": "2026-02-06T14:25:00Z"
      },
      {
        "id": "msg_002",
        "groupId": "project:proj_123",
        "sender": {
          "id": "agent_pm_001",
          "name": "产品经理",
          "role": "PRODUCT_MANAGER"
        },
        "type": "file",
        "content": {
          "text": "已更新 PRD 文档",
          "file": {
            "path": "PRD.md",
            "changeType": "update"
          }
        },
        "createdAt": "2026-02-06T14:26:00Z"
      }
    ],
    "hasMore": true
  },
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 50,
      "total": 156
    }
  }
}
```

### 4.3 获取未读消息

```http
GET /messages/unread/:agentId
```

**响应**:
```json
{
  "success": true,
  "data": {
    "count": 5,
    "messages": [ ... ]
  }
}
```

### 4.4 标记已读

```http
POST /messages/read
```

**请求体**:
```json
{
  "agentId": "agent_cto_001",
  "messageIds": ["msg_001", "msg_002"]
}
```

### 4.5 添加表情反应

```http
POST /messages/:messageId/reaction
```

**请求体**:
```json
{
  "agentId": "agent_pm_001",
  "emoji": "👍"
}
```

---

## 5. File API

### 5.1 获取文件树

```http
GET /files?projectId=proj_123
```

**响应**:
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "id": "file_001",
        "path": "PRD.md",
        "type": "file",
        "status": "active",
        "version": 3,
        "generatedByAgentId": "agent_pm_001",
        "updatedAt": "2026-02-06T14:00:00Z"
      },
      {
        "id": "file_002",
        "path": "src",
        "type": "directory",
        "children": [
          { "id": "file_003", "path": "src/components", "type": "directory", ... },
          { "id": "file_004", "path": "src/index.ts", "type": "file", ... }
        ]
      }
    ]
  }
}
```

### 5.2 获取文件内容

```http
GET /files/:fileId/content
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "file_001",
    "path": "PRD.md",
    "content": "# Todo App 产品需求文档\n\n## 1. 概述\n...",
    "version": 3,
    "language": "markdown"
  }
}
```

### 5.3 更新文件

```http
PUT /files/:fileId
```

**请求体**:
```json
{
  "content": "# 更新后的内容...",
  "updatedBy": "user_123"
}
```

### 5.4 获取文件版本历史

```http
GET /files/:fileId/versions
```

**响应**:
```json
{
  "success": true,
  "data": {
    "versions": [
      {
        "version": 3,
        "changeType": "update",
        "changedBy": "agent_pm_001",
        "changeSummary": "增加协作功能章节",
        "createdAt": "2026-02-06T14:00:00Z"
      },
      {
        "version": 2,
        "changeType": "update",
        "changedBy": "agent_pm_001",
        "createdAt": "2026-02-06T13:00:00Z"
      }
    ]
  }
}
```

### 5.5 获取特定版本内容

```http
GET /files/:fileId/versions/:version
```

---

## 6. Execution API

### 6.1 开始执行

```http
POST /execution/:workflowId/start
```

**响应**:
```json
{
  "success": true,
  "data": {
    "executionId": "exec_abc123",
    "status": "running",
    "startedAt": "2026-02-06T14:30:00Z",
    "agents": [
      { "id": "agent_cto_001", "status": "running" }
    ]
  }
}
```

### 6.2 获取执行状态

```http
GET /execution/:executionId
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "exec_abc123",
    "status": "running",
    "workflowId": "wf_123",
    "progress": {
      "totalNodes": 8,
      "completedNodes": 3,
      "currentNodeId": "t4",
      "percent": 37.5
    },
    "agentStatus": [
      {
        "agentId": "agent_cto_001",
        "status": "completed",
        "completedTasks": ["t1", "t2"]
      },
      {
        "agentId": "agent_fe_001",
        "status": "running",
        "currentTask": {
          "id": "t4",
          "title": "开发登录页面",
          "progress": 60
        }
      }
    ],
    "startedAt": "2026-02-06T14:30:00Z",
    "estimatedEndAt": "2026-02-06T16:00:00Z"
  }
}
```

### 6.3 暂停执行

```http
POST /execution/:executionId/pause
```

### 6.4 恢复执行

```http
POST /execution/:executionId/resume
```

### 6.5 停止执行

```http
POST /execution/:executionId/stop
```

---

## 7. Checkpoint API

### 7.1 创建检查点

```http
POST /checkpoints
```

**请求体**:
```json
{
  "agentId": "agent_cto_001",
  "label": "完成架构设计",
  "description": "数据库和API设计已完成"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "cp_abc123",
    "agentId": "agent_cto_001",
    "label": "完成架构设计",
    "storagePath": "checkpoints/agent_cto_001/cp_abc123.msgpack",
    "createdAt": "2026-02-06T15:00:00Z"
  }
}
```

### 7.2 列出检查点

```http
GET /checkpoints?agentId=agent_cto_001
```

### 7.3 恢复到检查点

```http
POST /checkpoints/:checkpointId/restore
```

---

## 8. WebSocket API

### 8.1 连接

```javascript
const ws = new WebSocket('wss://api.horos.dev/ws/v2/projects/:projectId');

ws.onopen = () => {
  // 发送认证消息
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'Bearer jwt_token_here'
  }));
};
```

### 8.2 消息类型

#### 8.2.1 客户端 → 服务端

```typescript
// 心跳
{ type: 'ping', timestamp: number }

// 订阅群组
{ type: 'subscribe', groupId: string }

// 发送消息（WebSocket 模式）
{
  type: 'send_message',
  payload: {
    groupId: string,
    content: { text: string, mentions?: string[] }
  }
}
```

#### 8.2.2 服务端 → 客户端

```typescript
// 新消息
{
  type: 'new_message',
  payload: Message
}

// 执行进度更新
{
  type: 'execution_progress',
  payload: {
    executionId: string,
    nodeId: string,
    status: 'running' | 'completed' | 'failed',
    progress?: number,
    output?: any
  }
}

// Agent 状态变更
{
  type: 'agent_status_change',
  payload: {
    agentId: string,
    status: AgentStatus,
    currentTask?: Task
  }
}

// 文件变更
{
  type: 'file_change',
  payload: {
    fileId: string,
    path: string,
    changeType: 'create' | 'update' | 'delete',
    content?: string
  }
}

// 心跳响应
{ type: 'pong', timestamp: number }

// 错误
{
  type: 'error',
  payload: {
    code: string,
    message: string
  }
}
```

---

## 9. Rate Limiting

| API | 限制 |
|-----|------|
| Master Agent API | 10 requests/minute |
| Message API | 60 requests/minute |
| File API | 30 requests/minute |
| Other API | 100 requests/minute |
| WebSocket | 1 connection/client |

---

**下一步**: 开始实施 Phase A - Master Agent 模块。
