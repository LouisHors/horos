# 数据模型 V2 设计文档

> 版本: v2.0  
> 日期: 2026-02-06  
> 关联: [系统总览](./SYSTEM_OVERVIEW_V2.md)

---

## 1. 概述

### 1.1 变更说明

V2 数据模型在 V1 基础上新增以下实体:
- **Agent 角色和实例** - 支持多 Agent 协作
- **消息系统** - IM 群聊支持
- **审核队列** - AI生成后的人工审核
- **项目文件** - 文件管理和版本

### 1.2 兼容性

- V1 表结构保持不变
- V2 新增表通过 `project_id` 与 V1 关联
- 支持 V1 数据迁移到 V2

---

## 2. 实体关系图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           V2 数据模型 ER 图                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐       ┌─────────────┐       ┌─────────────┐               │
│  │   users     │◀──────│  projects   │──────▶│  workflows  │               │
│  │  (V1保留)   │       │  (V1保留)   │       │  (V1保留)   │               │
│  └─────────────┘       └──────┬──────┘       └─────────────┘               │
│                               │                                             │
│                               │ 1:N                                         │
│                               ▼                                             │
│                      ┌─────────────────┐                                    │
│                      │ review_queue    │                                    │
│                      │ (V2新增)        │                                    │
│                      └────────┬────────┘                                    │
│                               │                                             │
│                               │ 1:N                                         │
│                               ▼                                             │
│                      ┌─────────────────┐                                    │
│                      │agent_instances  │◀──────────┐                        │
│                      │ (V2新增)        │           │                        │
│                      └────────┬────────┘           │                        │
│                               │                    │                        │
│                               │ 1:N                │ N:M                     │
│                               ▼                    ▼                        │
│                      ┌─────────────────┐  ┌─────────────────┐              │
│                      │    messages     │  │    groups       │              │
│                      │ (V2新增)        │  │  (V2新增)       │              │
│                      └─────────────────┘  └─────────────────┘              │
│                                                                             │
│                      ┌─────────────────┐  ┌─────────────────┐              │
│                      │  project_files  │  │  checkpoints    │              │
│                      │ (V2新增)        │  │  (V2新增)       │              │
│                      └─────────────────┘  └─────────────────┘              │
│                                                                             │
│                      ┌─────────────────┐                                    │
│                      │   task_queue    │                                    │
│                      │ (V2新增)        │                                    │
│                      └─────────────────┘                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 详细表结构

### 3.1 核心表 (V1保留)

```sql
-- ============================================
-- V1 保留表（不做修改）
-- ============================================

-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 项目表
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 工作流定义表
CREATE TABLE workflow_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  definition JSONB NOT NULL, -- ReactFlow DSL
  version INTEGER DEFAULT 1,
  is_template BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 执行实例表（V1扩展）
CREATE TABLE execution_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflow_definitions(id),
  status VARCHAR(20) NOT NULL, -- pending/running/paused/completed/failed
  result JSONB,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.2 V2 新增表

```sql
-- ============================================
-- V2 新增表
-- ============================================

-- ----------------------------------------
-- 1. 审核队列表
-- ----------------------------------------
CREATE TABLE review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- 关联的用户需求
  requirement_text TEXT NOT NULL,
  requirement_analysis JSONB,
  
  -- AI生成的内容
  generated_workflow_id UUID REFERENCES workflow_definitions(id),
  generated_roles JSONB NOT NULL, -- RoleAssignment[]
  generated_tasks JSONB NOT NULL, -- TaskGraph
  
  -- 审核状态
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- pending: 待审核
    -- approved: 已批准
    -- rejected: 已拒绝
    -- modified: 用户修改后
    -- executing: 执行中
  
  -- 用户反馈
  reviewer_id UUID REFERENCES users(id),
  reviewer_feedback TEXT,
  modified_workflow_id UUID REFERENCES workflow_definitions(id),
  
  -- 执行引用
  execution_id UUID REFERENCES execution_instances(id),
  
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  executed_at TIMESTAMP,
  
  CONSTRAINT valid_status CHECK (status IN (
    'pending', 'approved', 'rejected', 'modified', 'executing'
  ))
);

CREATE INDEX idx_review_queue_project ON review_queue(project_id);
CREATE INDEX idx_review_queue_status ON review_queue(status);

-- ----------------------------------------
-- 2. Agent 角色模板表
-- ----------------------------------------
CREATE TABLE agent_role_templates (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(10) NOT NULL,
  description TEXT,
  
  -- 系统提示词
  system_prompt TEXT NOT NULL,
  
  -- 能力列表
  capabilities TEXT[] NOT NULL,
  
  -- 预期产出物
  output_artifacts TEXT[] NOT NULL,
  
  -- 协作配置
  can_parallel_with TEXT[], -- 可并行的角色
  default_dependencies TEXT[], -- 默认依赖角色
  
  -- 执行配置
  config JSONB DEFAULT '{}',
  -- {
  --   "llm": { "model": "GLM-4.7", "temperature": 0.7 },
  --   "max_tasks": 5,
  --   "timeout_minutes": 30
  -- }
  
  is_builtin BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 插入内置角色模板
INSERT INTO agent_role_templates 
  (id, name, icon, description, system_prompt, capabilities, output_artifacts, can_parallel_with, default_dependencies)
VALUES
  ('CTO', 'CTO', '🤖', '技术负责人', 
   '你是CTO，负责系统架构设计...', 
   ARRAY['architecture_design', 'tech_selection', 'api_design'], 
   ARRAY['Architecture.md', 'TechStack.md', 'API.md'],
   ARRAY['PRODUCT_MANAGER'],
   ARRAY[]
  ),
  ('PRODUCT_MANAGER', '产品经理', '📝', '负责需求分析和PRD',
   '你是产品经理，负责需求分析...',
   ARRAY['requirement_analysis', 'prd_writing', 'user_story'],
   ARRAY['PRD.md', 'UserStories.md'],
   ARRAY['CTO'],
   ARRAY[]
  ),
  ('FRONTEND_DEV', '前端开发', '💻', '负责UI实现',
   '你是前端开发工程师...',
   ARRAY['ui_development', 'component_design', 'state_management'],
   ARRAY['src/components/', 'src/pages/'],
   ARRAY['BACKEND_DEV'],
   ARRAY['CTO', 'PRODUCT_MANAGER']
  ),
  ('BACKEND_DEV', '后端开发', '⚙️', '负责服务端开发',
   '你是后端开发工程师...',
   ARRAY['api_development', 'database_design', 'business_logic'],
   ARRAY['src/api/', 'src/models/'],
   ARRAY['FRONTEND_DEV'],
   ARRAY['CTO']
  ),
  ('QA_ENGINEER', 'QA工程师', '🧪', '负责测试',
   '你是QA工程师...',
   ARRAY['test_design', 'test_implementation', 'bug_report'],
   ARRAY['tests/', 'TestPlan.md'],
   ARRAY[],
   ARRAY['FRONTEND_DEV', 'BACKEND_DEV']
  ),
  ('CODE_REVIEWER', '代码评审', '👀', '负责代码质量',
   '你是代码评审专家...',
   ARRAY['code_review', 'best_practices', 'refactoring_suggestion'],
   ARRAY['ReviewComments.md'],
   ARRAY['QA_ENGINEER'],
   ARRAY['FRONTEND_DEV', 'BACKEND_DEV']
  );

-- ----------------------------------------
-- 3. Agent 实例表
-- ----------------------------------------
CREATE TABLE agent_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  review_queue_id UUID REFERENCES review_queue(id),
  
  -- 角色信息
  role_template_id VARCHAR(50) REFERENCES agent_role_templates(id),
  custom_role_name VARCHAR(100), -- 动态创建时的角色名
  custom_role_config JSONB, -- 动态创建时的配置
  
  -- 实例信息
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(10),
  
  -- 执行状态
  status VARCHAR(20) NOT NULL DEFAULT 'idle',
    -- idle: 空闲
    -- initializing: 初始化中
    -- running: 运行中
    -- paused: 已暂停
    -- completed: 已完成
    -- error: 错误
    -- terminated: 已终止
  
  -- 当前任务
  current_task_id UUID,
  task_queue UUID[], -- 待办任务ID列表
  
  -- 上下文存储路径（实际数据在 Redis/MinIO）
  context_storage_key VARCHAR(200),
  
  -- 执行统计
  stats JSONB DEFAULT '{
    "tasks_completed": 0,
    "tasks_failed": 0,
    "messages_sent": 0,
    "total_execution_time_ms": 0
  }',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN (
    'idle', 'initializing', 'running', 'paused', 'completed', 'error', 'terminated'
  ))
);

CREATE INDEX idx_agent_instances_project ON agent_instances(project_id);
CREATE INDEX idx_agent_instances_status ON agent_instances(status);
CREATE INDEX idx_agent_instances_role ON agent_instances(role_template_id);

-- ----------------------------------------
-- 4. 消息表
-- ----------------------------------------
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- 群组信息
  group_id VARCHAR(100) NOT NULL,
    -- 格式: 'project:{project_id}' 或 'task:{task_id}'
  
  -- 发送者
  sender_id VARCHAR(100) NOT NULL, -- agent_id 或 'user:{user_id}'
  sender_name VARCHAR(100) NOT NULL,
  sender_role VARCHAR(50), -- CTO/PM/FRONTEND_DEV/user/system
  sender_avatar TEXT,
  
  -- 消息类型
  type VARCHAR(20) NOT NULL,
    -- chat: 普通聊天
    -- task: 任务相关
    -- system: 系统通知
    -- file: 文件变更
    -- code: 代码片段
  
  -- 消息内容
  content_text TEXT NOT NULL,
  content_metadata JSONB DEFAULT '{}',
    -- chat: { mentions: ['agent-id'] }
    -- task: { taskId, action: 'assign|complete|block' }
    -- file: { path, changeType: 'create|update|delete', diff }
    -- code: { language, code }
  
  -- 交互信息
  reply_to UUID REFERENCES messages(id),
  mentions UUID[], -- @提及的agent实例ID
  
  -- 阅读状态
  read_by UUID[] DEFAULT '{}',
  
  -- 表情反应
  reactions JSONB DEFAULT '[]',
    -- [{ agent_id, emoji, created_at }]
  
  created_at TIMESTAMP DEFAULT NOW(),
  edited_at TIMESTAMP,
  
  CONSTRAINT valid_type CHECK (type IN (
    'chat', 'task', 'system', 'file', 'code'
  ))
);

-- 消息表索引
CREATE INDEX idx_messages_project ON messages(project_id);
CREATE INDEX idx_messages_group ON messages(group_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_mentions ON messages USING GIN(mentions);

-- 消息表分区（按时间）
-- 每月一个分区，保留6个月
CREATE TABLE messages_y2024m01 PARTITION OF messages
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
-- ... 更多分区

-- ----------------------------------------
-- 5. 群组表
-- ----------------------------------------
CREATE TABLE groups (
  id VARCHAR(100) PRIMARY KEY, -- 'project:{id}' 或 'task:{id}'
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  type VARCHAR(20) NOT NULL,
    -- project: 项目级群聊（所有Agent）
    -- task: 任务级群聊（特定任务相关Agent）
  
  name VARCHAR(200),
  description TEXT,
  
  -- 成员
  members UUID[] NOT NULL, -- agent_instances.id 列表
  
  -- 如果是任务群聊
  task_id UUID,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_groups_project ON groups(project_id);
CREATE INDEX idx_groups_members ON groups USING GIN(members);

-- ----------------------------------------
-- 6. 项目文件表
-- ----------------------------------------
CREATE TABLE project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- 文件路径
  path VARCHAR(500) NOT NULL,
  
  -- 文件类型
  type VARCHAR(20) NOT NULL,
    -- file: 普通文件
    -- directory: 目录
  
  -- 内容存储（小文件直接存，大文件存MinIO）
  content TEXT, -- 小于1MB的文件内容
  storage_key VARCHAR(500), -- 大文件在MinIO的key
  
  -- 版本信息
  version INTEGER DEFAULT 1,
  
  -- 创建/修改者
  created_by VARCHAR(100), -- agent_id 或 user_id
  updated_by VARCHAR(100),
  
  -- 文件状态
  status VARCHAR(20) DEFAULT 'active',
    -- active: 正常
    -- modified: 已修改未提交
    -- conflict: 冲突
    -- deleted: 已删除
  
  -- 执行关联
  generated_by_task_id UUID,
  generated_by_agent_id UUID REFERENCES agent_instances(id),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- 项目内路径唯一
  UNIQUE(project_id, path)
);

CREATE INDEX idx_project_files_project ON project_files(project_id);
CREATE INDEX idx_project_files_path ON project_files(path);
CREATE INDEX idx_project_files_agent ON project_files(generated_by_agent_id);

-- ----------------------------------------
-- 7. 文件版本历史表
-- ----------------------------------------
CREATE TABLE file_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES project_files(id) ON DELETE CASCADE,
  
  version INTEGER NOT NULL,
  content TEXT,
  storage_key VARCHAR(500),
  
  -- 变更信息
  change_type VARCHAR(20) NOT NULL, -- create/update/delete
  changed_by VARCHAR(100),
  change_summary TEXT, -- 变更摘要
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(file_id, version)
);

CREATE INDEX idx_file_versions_file ON file_versions(file_id);
CREATE INDEX idx_file_versions_version ON file_versions(version DESC);

-- ----------------------------------------
-- 8. 检查点表
-- ----------------------------------------
CREATE TABLE checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agent_instances(id) ON DELETE CASCADE,
  
  label VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- 存储信息（实际数据在MinIO）
  storage_path VARCHAR(500) NOT NULL,
  size_bytes INTEGER,
  
  -- 检查点内容摘要
  summary JSONB,
    -- {
    --   session_messages_count: 10,
    --   task_queue_length: 3,
    --   current_task_progress: 50,
    --   files_modified: ['src/index.ts']
    -- }
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_checkpoints_agent ON checkpoints(agent_id);
CREATE INDEX idx_checkpoints_created_at ON checkpoints(created_at DESC);

-- ----------------------------------------
-- 9. 任务队列表
-- ----------------------------------------
CREATE TABLE task_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- 任务信息
  title VARCHAR(200) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
    -- code_generation: 代码生成
    -- code_review: 代码评审
    -- architecture_design: 架构设计
    -- document_writing: 文档编写
    -- testing: 测试
    -- research: 调研
  
  -- 执行配置
  config JSONB DEFAULT '{}',
    -- {
    --   expected_output: 'filename or format',
    --   constraints: ['使用TypeScript', '遵循现有代码风格'],
    --   context_files: ['src/types.ts']
    -- }
  
  -- 分配和执行
  assigned_to UUID REFERENCES agent_instances(id),
  status VARCHAR(20) DEFAULT 'pending',
    -- pending: 待分配
    -- assigned: 已分配
    -- running: 执行中
    -- completed: 已完成
    -- failed: 失败
    -- blocked: 被阻塞
  
  -- 依赖关系
  dependencies UUID[], -- 依赖的任务ID
  blocking UUID[], -- 阻塞的任务ID
  
  -- 优先级
  priority INTEGER DEFAULT 0, -- 0-10，越大越优先
  
  -- 结果
  result JSONB,
  error TEXT,
  
  -- 时间
  created_at TIMESTAMP DEFAULT NOW(),
  assigned_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  CONSTRAINT valid_status CHECK (status IN (
    'pending', 'assigned', 'running', 'completed', 'failed', 'blocked'
  ))
);

CREATE INDEX idx_task_queue_project ON task_queue(project_id);
CREATE INDEX idx_task_queue_status ON task_queue(status);
CREATE INDEX idx_task_queue_assigned ON task_queue(assigned_to);
CREATE INDEX idx_task_queue_priority ON task_queue(priority DESC);

-- ----------------------------------------
-- 10. 执行日志表
-- ----------------------------------------
CREATE TABLE execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES execution_instances(id),
  agent_id UUID REFERENCES agent_instances(id),
  
  level VARCHAR(20) NOT NULL, -- info/warn/error/debug
  message TEXT NOT NULL,
  metadata JSONB,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_execution_logs_execution ON execution_logs(execution_id);
CREATE INDEX idx_execution_logs_agent ON execution_logs(agent_id);
CREATE INDEX idx_execution_logs_created ON execution_logs(created_at);
```

---

## 4. 视图

```sql
-- 项目概览视图
CREATE VIEW project_overview AS
SELECT 
  p.id,
  p.name,
  p.status,
  COUNT(DISTINCT ai.id) as agent_count,
  COUNT(DISTINCT m.id) as message_count,
  COUNT(DISTINCT pf.id) as file_count,
  COUNT(DISTINCT tq.id) FILTER (WHERE tq.status = 'pending') as pending_tasks,
  COUNT(DISTINCT tq.id) FILTER (WHERE tq.status = 'completed') as completed_tasks
FROM projects p
LEFT JOIN agent_instances ai ON ai.project_id = p.id
LEFT JOIN messages m ON m.project_id = p.id
LEFT JOIN project_files pf ON pf.project_id = p.id
LEFT JOIN task_queue tq ON tq.project_id = p.id
GROUP BY p.id, p.name, p.status;

-- Agent 工作统计视图
CREATE VIEW agent_stats AS
SELECT 
  ai.id,
  ai.name,
  ai.role_template_id,
  ai.status,
  COUNT(DISTINCT tq.id) FILTER (WHERE tq.status = 'completed') as tasks_completed,
  COUNT(DISTINCT tq.id) FILTER (WHERE tq.status = 'failed') as tasks_failed,
  COUNT(DISTINCT m.id) as messages_sent,
  MAX(m.created_at) as last_activity
FROM agent_instances ai
LEFT JOIN task_queue tq ON tq.assigned_to = ai.id
LEFT JOIN messages m ON m.sender_id = ai.id::text
GROUP BY ai.id, ai.name, ai.role_template_id, ai.status;

-- 活跃会话视图
CREATE VIEW active_sessions AS
SELECT 
  m.group_id,
  COUNT(DISTINCT m.sender_id) as participant_count,
  COUNT(*) as message_count,
  MAX(m.created_at) as last_message_at
FROM messages m
WHERE m.created_at > NOW() - INTERVAL '24 hours'
GROUP BY m.group_id;
```

---

## 5. 触发器

```sql
-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agent_instances_updated_at
  BEFORE UPDATE ON agent_instances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_files_updated_at
  BEFORE UPDATE ON project_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 消息插入时自动推送到 Redis
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  -- 使用 pg_notify 触发外部监听
  PERFORM pg_notify('new_message', json_build_object(
    'project_id', NEW.project_id,
    'group_id', NEW.group_id,
    'message_id', NEW.id
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION notify_new_message();

-- 文件版本自动创建
CREATE OR REPLACE FUNCTION create_file_version()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.content != OLD.content THEN
    INSERT INTO file_versions (
      file_id, version, content, storage_key,
      change_type, changed_by, change_summary
    ) VALUES (
      NEW.id, OLD.version + 1, OLD.content, OLD.storage_key,
      'update', NEW.updated_by, 'Content updated'
    );
    NEW.version = OLD.version + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_file_version
  BEFORE UPDATE ON project_files
  FOR EACH ROW EXECUTE FUNCTION create_file_version();
```

---

## 6. 迁移策略

### 6.1 从 V1 迁移到 V2

```sql
-- 步骤1: 创建 V2 表（执行上面的 CREATE TABLE 语句）

-- 步骤2: 为现有项目创建默认 Agent 实例
INSERT INTO agent_instances (
  project_id, name, role_template_id, status
)
SELECT 
  id, 
  'Legacy Executor', 
  NULL, 
  'terminated'
FROM projects;

-- 步骤3: 标记旧工作流为 V1
ALTER TABLE workflow_definitions ADD COLUMN version_tag VARCHAR(10) DEFAULT 'v1';
UPDATE workflow_definitions SET version_tag = 'v1';

-- 步骤4: 数据验证脚本
-- 检查是否有孤立的 agent_instances
SELECT * FROM agent_instances WHERE project_id NOT IN (SELECT id FROM projects);
```

---

**下一步**: 创建消息总线设计文档和 API 设计文档。
