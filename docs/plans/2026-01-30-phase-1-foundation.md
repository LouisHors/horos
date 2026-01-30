# Phase 1: 基础架构搭建 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use horspowers:executing-plans to implement this plan task-by-task.

**日期**: 2026-01-30  
**预计用时**: 10天  
**任务数量**: 17个

## 目标

搭建 AI Agent 可视化编排工具的完整项目基础架构，包括 Monorepo 结构、TypeScript 配置、Next.js 全栈应用、数据库 Schema 和基础 API。

## 架构方案

采用 Turborepo + pnpm workspace 构建 Monorepo，Next.js 16 App Router 提供全栈能力，Drizzle ORM 管理 PostgreSQL 数据库，Redis 作为缓存和消息队列。

## 技术栈

Turborepo, pnpm, Next.js 16, TypeScript 5, Tailwind CSS 4, shadcn/ui, Drizzle ORM, PostgreSQL 16, Redis 7

---

## Task 1: 初始化 Monorepo 项目结构

**Files:**
- Create: `package.json` (root)
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.gitignore`

**Step 1: 创建根 package.json**

```json
{
  "name": "ai-agent-orchestration-platform",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "db:generate": "cd packages/core && pnpm db:generate",
    "db:migrate": "cd packages/core && pnpm db:migrate",
    "db:studio": "cd packages/core && pnpm db:studio"
  },
  "devDependencies": {
    "turbo": "^2.3.0"
  },
  "packageManager": "pnpm@9.0.0"
}
```

**Step 2: 创建 pnpm-workspace.yaml**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**Step 3: 创建 turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {}
  }
}
```

**Step 4: 创建 .gitignore**

```
# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
.next/
dist/
build/
*.tsbuildinfo

# Environment variables
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
pnpm-debug.log*

# Testing
coverage/
```

**Step 5: 初始化 Git 仓库**

```bash
git init
git add .
git commit -m "chore: initialize monorepo structure"
```

---

## Task 2: 配置 TypeScript 和代码规范

**Files:**
- Create: `packages/config/typescript/base.json`
- Create: `packages/config/eslint/index.js`
- Create: `packages/config/prettier/index.json`
- Create: `packages/config/package.json`

**Step 1: 创建 packages/config 目录结构**

```bash
mkdir -p packages/config/typescript
```

**Step 2: 创建 TypeScript 基础配置**

```json
// packages/config/typescript/base.json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": true,
    "jsx": "preserve",
    "noEmit": true,
    "isolatedModules": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

**Step 3: 创建 config package.json**

```json
// packages/config/package.json
{
  "name": "@ai-agent/config",
  "version": "1.0.0",
  "private": true,
  "files": ["typescript", "eslint", "prettier"],
  "scripts": {
    "clean": "rm -rf node_modules"
  }
}
```

**Step 4: 提交**

```bash
git add packages/config/
git commit -m "chore: add shared typescript config"
```

---

## Task 3: 初始化 Next.js Web 应用

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`

**Step 1: 创建 apps/web/package.json**

```json
{
  "name": "@ai-agent/web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^16.1.6",
    "react": "^19.2.4",
    "react-dom": "^19.2.4"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^5"
  }
}
```

**Step 2: 创建 apps/web/tsconfig.json**

```json
{
  "extends": "@ai-agent/config/typescript/base.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Step 3: 创建 apps/web/next.config.ts**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
```

**Step 4: 创建基础布局文件**

```tsx
// apps/web/app/layout.tsx
export const metadata = {
  title: "AI Agent Orchestration Platform",
  description: "Visual AI Agent workflow orchestration tool",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
```

```tsx
// apps/web/app/page.tsx
export default function Home() {
  return (
    <main>
      <h1>AI Agent Orchestration Platform</h1>
      <p>Welcome to the future of AI workflow orchestration.</p>
    </main>
  );
}
```

**Step 5: 安装依赖并测试**

```bash
cd apps/web
pnpm install
pnpm dev
# 验证: 浏览器访问 http://localhost:3000 显示欢迎页面
```

**Step 6: 提交**

```bash
git add apps/web/
git commit -m "feat: initialize next.js web application"
```

---

## Task 4: 配置 Tailwind CSS 和 shadcn/ui

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/app/globals.css`
- Modify: `apps/web/app/layout.tsx`

**Step 1: 添加 Tailwind CSS 依赖**

```bash
cd apps/web
pnpm add -D tailwindcss postcss autoprefixer
pnpm dlx tailwindcss init -ts
```

**Step 2: 配置 tailwind.config.ts**

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
```

**Step 3: 创建 globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 4: 更新 layout.tsx 引入样式**

```tsx
import "./globals.css";

export const metadata = {
  title: "AI Agent Orchestration Platform",
  description: "Visual AI Agent workflow orchestration tool",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

**Step 5: 测试 Tailwind**

```tsx
// 修改 apps/web/app/page.tsx
export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold text-blue-600">
        AI Agent Orchestration Platform
      </h1>
      <p className="mt-4 text-gray-700">
        Welcome to the future of AI workflow orchestration.
      </p>
    </main>
  );
}
```

```bash
pnpm dev
# 验证: 页面显示蓝色标题和灰色背景
```

**Step 6: 提交**

```bash
git add apps/web/
git commit -m "chore: setup tailwind css"
```

---

## Task 5: 配置 Drizzle ORM 和数据库连接

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/src/db/index.ts`
- Create: `packages/core/drizzle.config.ts`

**Step 1: 创建 packages/core 结构**

```bash
mkdir -p packages/core/src/db
```

**Step 2: 创建 packages/core/package.json**

```json
{
  "name": "@ai-agent/core",
  "version": "1.0.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "clean": "rm -rf dist node_modules"
  },
  "dependencies": {
    "drizzle-orm": "^0.45.1",
    "postgres": "^3.4.8",
    "redis": "^4.7.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "drizzle-kit": "^0.30.0",
    "typescript": "^5"
  }
}
```

**Step 3: 创建数据库连接文件**

```typescript
// packages/core/src/db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client);

// Redis client
import { createClient } from "redis";

export const redis = createClient({
  url: process.env.REDIS_URL,
});

redis.on("error", (err) => console.error("Redis Client Error", err));
```

**Step 4: 创建 drizzle.config.ts**

```typescript
// packages/core/drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

**Step 5: 安装依赖**

```bash
cd packages/core
pnpm install
```

**Step 6: 提交**

```bash
git add packages/core/
git commit -m "chore: setup drizzle orm and database connection"
```

---

## Task 6: 定义数据库 Schema - Workspaces 和 Agents

**Files:**
- Create: `packages/core/src/db/schema.ts`
- Create: `packages/core/src/db/schema/workspaces.ts`
- Create: `packages/core/src/db/schema/agents.ts`

**Step 1: 创建 schema 目录结构**

```bash
mkdir -p packages/core/src/db/schema
touch packages/core/src/db/schema.ts
```

**Step 2: 创建 workspaces schema**

```typescript
// packages/core/src/db/schema/workspaces.ts
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: uuid("created_by").notNull(),
});

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
```

**Step 3: 创建 agents schema**

```typescript
// packages/core/src/db/schema/agents.ts
import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";

export const agentDefinitions = pgTable(
  "agent_definitions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    name: text("name").notNull(),
    role: text("role").notNull(),
    description: text("description"),
    parentId: uuid("parent_id"),
    llmConfig: jsonb("llm_config").notNull(),
    tools: jsonb("tools").$type<string[]>().default([]),
    mcpServers: jsonb("mcp_servers"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: uuid("created_by").notNull(),
  },
  (table) => ({
    workspaceIdx: index("agent_def_workspace_idx").on(table.workspaceId),
  })
);

export const agentInstances = pgTable(
  "agent_instances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    definitionId: uuid("definition_id")
      .notNull()
      .references(() => agentDefinitions.id),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    status: text("status").notNull().default("idle"),
    llmHistory: jsonb("llm_history").$type<LLMMessage[]>().default([]),
    currentGroupId: uuid("current_group_id"),
    currentTask: text("current_task"),
    tokenUsage: integer("token_usage").default(0),
    messageCount: integer("message_count").default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    workspaceIdx: index("agent_inst_workspace_idx").on(table.workspaceId),
    statusIdx: index("agent_inst_status_idx").on(table.status),
  })
);

type LLMMessage =
  | { role: "system" | "user" | "assistant"; content: string }
  | { role: "tool"; content: string; tool_call_id: string; name: string };

export type AgentDefinition = typeof agentDefinitions.$inferSelect;
export type NewAgentDefinition = typeof agentDefinitions.$inferInsert;
export type AgentInstance = typeof agentInstances.$inferSelect;
export type NewAgentInstance = typeof agentInstances.$inferInsert;
```

**Step 4: 创建主 schema 导出文件**

```typescript
// packages/core/src/db/schema.ts
export * from "./schema/workspaces";
export * from "./schema/agents";
```

**Step 5: 提交**

```bash
git add packages/core/src/db/
git commit -m "feat: add workspaces and agents database schema"
```

---

## Task 7: 定义数据库 Schema - Workflows 和 Executions

**Files:**
- Create: `packages/core/src/db/schema/workflows.ts`
- Create: `packages/core/src/db/schema/executions.ts`
- Modify: `packages/core/src/db/schema.ts`

**Step 1: 创建 workflows schema**

```typescript
// packages/core/src/db/schema/workflows.ts
import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";

export const workflowDefinitions = pgTable("workflow_definitions", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  name: text("name").notNull(),
  description: text("description"),
  nodes: jsonb("nodes").notNull(),
  edges: jsonb("edges").notNull(),
  config: jsonb("config"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: uuid("created_by").notNull(),
});

export type WorkflowDefinition = typeof workflowDefinitions.$inferSelect;
export type NewWorkflowDefinition = typeof workflowDefinitions.$inferInsert;
```

**Step 2: 创建 executions schema**

```typescript
// packages/core/src/db/schema/executions.ts
import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { workflowDefinitions } from "./workflows";
import { workspaces } from "./workspaces";

export const executionInstances = pgTable(
  "execution_instances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => workflowDefinitions.id),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    status: text("status").notNull().default("pending"),
    inputs: jsonb("inputs"),
    outputs: jsonb("outputs"),
    nodeStates: jsonb("node_states"),
    agentInstances: jsonb("agent_instances").$type<string[]>(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: uuid("created_by").notNull(),
  },
  (table) => ({
    workflowIdx: index("exec_workflow_idx").on(table.workflowId),
    statusIdx: index("exec_status_idx").on(table.status),
  })
);

export type ExecutionInstance = typeof executionInstances.$inferSelect;
export type NewExecutionInstance = typeof executionInstances.$inferInsert;
```

**Step 3: 更新主 schema 文件**

```typescript
// packages/core/src/db/schema.ts
export * from "./schema/workspaces";
export * from "./schema/agents";
export * from "./schema/workflows";
export * from "./schema/executions";
```

**Step 4: 提交**

```bash
git add packages/core/src/db/
git commit -m "feat: add workflows and executions database schema"
```

---

## Task 8: 定义数据库 Schema - IM 消息系统

**Files:**
- Create: `packages/core/src/db/schema/messages.ts`
- Modify: `packages/core/src/db/schema.ts`

**Step 1: 创建 messages schema**

```typescript
// packages/core/src/db/schema/messages.ts
import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";

export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  name: text("name"),
  type: text("type").notNull().default("group"), // 'p2p' | 'group'
  contextTokens: integer("context_tokens").default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const groupMembers = pgTable(
  "group_members",
  {
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id),
    agentId: uuid("agent_id").notNull(),
    role: text("role").notNull().default("member"), // 'owner' | 'member'
    lastReadMessageId: uuid("last_read_message_id"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.groupId, table.agentId] }),
    groupIdx: index("group_members_group_idx").on(table.groupId),
  })
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id),
    senderId: uuid("sender_id").notNull(),
    contentType: text("content_type").notNull(), // 'text' | 'tool_call' | 'tool_result'
    content: text("content").notNull(),
    metadata: jsonb("metadata"),
    sendTime: timestamp("send_time", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    groupIdx: index("messages_group_idx").on(table.groupId),
    sendTimeIdx: index("messages_send_time_idx").on(table.sendTime),
  })
);

export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
export type GroupMember = typeof groupMembers.$inferSelect;
export type NewGroupMember = typeof groupMembers.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
```

**Step 2: 更新主 schema 文件**

```typescript
// packages/core/src/db/schema.ts
export * from "./schema/workspaces";
export * from "./schema/agents";
export * from "./schema/workflows";
export * from "./schema/executions";
export * from "./schema/messages";
```

**Step 3: 提交**

```bash
git add packages/core/src/db/
git commit -m "feat: add im message system database schema"
```

---

## Task 9: 创建数据库迁移

**Files:**
- Create: `docker-compose.yml` (root)
- Create: `.env.local` template

**Step 1: 创建 Docker Compose 配置**

```yaml
# docker-compose.yml
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: agent_platform
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

**Step 2: 创建环境变量模板**

```bash
# .env.local
cat > .env.local << 'EOF'
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agent_platform

# Redis
REDIS_URL=redis://localhost:6379

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:3000
EOF
```

**Step 3: 启动数据库并生成迁移**

```bash
# 启动数据库
docker-compose up -d

# 等待数据库就绪
sleep 5

# 生成迁移
cd packages/core
pnpm db:generate

# 执行迁移
pnpm db:migrate
```

**Step 4: 提交**

```bash
git add docker-compose.yml .env.local
git commit -m "chore: add docker compose and database migrations"
```

---

## Task 10: 创建核心类型定义

**Files:**
- Create: `packages/core/src/types/index.ts`
- Create: `packages/core/src/types/agent.ts`
- Create: `packages/core/src/types/workflow.ts`

**Step 1: 创建 types 目录**

```bash
mkdir -p packages/core/src/types
```

**Step 2: 创建 Agent 类型定义**

```typescript
// packages/core/src/types/agent.ts
export interface LLMConfig {
  provider: "openai" | "anthropic" | "azure" | "local";
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export interface AgentConfig {
  id?: string;
  name: string;
  role: string;
  description?: string;
  llmConfig: LLMConfig;
  tools: string[];
  mcpServers?: string[];
}

export type AgentStatus =
  | "idle"
  | "running"
  | "paused"
  | "error"
  | "terminated";

export interface AgentRuntimeState {
  agentId: string;
  status: AgentStatus;
  currentGroupId?: string;
  currentTask?: string;
  tokenUsage: number;
  messageCount: number;
}
```

**Step 3: 创建 Workflow 类型定义**

```typescript
// packages/core/src/types/workflow.ts
export interface WorkflowNode {
  id: string;
  type: "agent" | "tool" | "condition" | "parallel" | "human";
  position: { x: number; y: number };
  data: {
    label?: string;
    agentId?: string;
    toolId?: string;
    condition?: string;
    config?: Record<string, any>;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

export interface WorkflowConfig {
  maxConcurrency: number;
  timeout: number;
  retryPolicy: {
    maxAttempts: number;
    backoffType: "fixed" | "exponential" | "linear";
  };
}

export type ExecutionStatus =
  | "pending"
  | "running"
  | "paused"
  | "waiting_for_human"
  | "completed"
  | "failed"
  | "cancelled"
  | "timeout";

export interface NodeExecutionState {
  nodeId: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}
```

**Step 4: 创建主类型导出文件**

```typescript
// packages/core/src/types/index.ts
export * from "./agent";
export * from "./workflow";

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
```

**Step 5: 提交**

```bash
git add packages/core/src/types/
git commit -m "feat: add core type definitions"
```

---

## Task 11: 创建基础 API 路由

**Files:**
- Create: `apps/web/app/api/agents/route.ts`
- Create: `apps/web/app/api/workflows/route.ts`
- Create: `apps/web/lib/api-response.ts`

**Step 1: 创建 API 响应工具**

```typescript
// apps/web/lib/api-response.ts
export function successResponse<T>(data: T, status = 200) {
  return Response.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status = 500, details?: any) {
  return Response.json(
    { success: false, error: { message, details } },
    { status }
  );
}
```

**Step 2: 创建 Agents API 路由**

```typescript
// apps/web/app/api/agents/route.ts
import { NextRequest } from "next/server";
import { db } from "@ai-agent/core/src/db";
import { agentDefinitions } from "@ai-agent/core/src/db/schema";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const agents = await db.select().from(agentDefinitions);
    return successResponse(agents);
  } catch (error) {
    return errorResponse("Failed to fetch agents", 500, error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const [agent] = await db
      .insert(agentDefinitions)
      .values(body)
      .returning();
    return successResponse(agent, 201);
  } catch (error) {
    return errorResponse("Failed to create agent", 500, error);
  }
}
```

**Step 3: 创建 Workflows API 路由**

```typescript
// apps/web/app/api/workflows/route.ts
import { NextRequest } from "next/server";
import { db } from "@ai-agent/core/src/db";
import { workflowDefinitions } from "@ai-agent/core/src/db/schema";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const workflows = await db.select().from(workflowDefinitions);
    return successResponse(workflows);
  } catch (error) {
    return errorResponse("Failed to fetch workflows", 500, error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const [workflow] = await db
      .insert(workflowDefinitions)
      .values(body)
      .returning();
    return successResponse(workflow, 201);
  } catch (error) {
    return errorResponse("Failed to create workflow", 500, error);
  }
}
```

**Step 4: 提交**

```bash
git add apps/web/app/api/ apps/web/lib/
git commit -m "feat: add basic api routes for agents and workflows"
```

---

## Task 12: 配置测试框架

**Files:**
- Create: `vitest.config.ts` (root)
- Create: `packages/core/vitest.config.ts`
- Create: `packages/core/src/db/schema.test.ts`

**Step 1: 创建根 Vitest 配置**

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
});
```

**Step 2: 添加测试依赖到 core package**

```json
// 修改 packages/core/package.json 添加 devDependencies
{
  "devDependencies": {
    "@types/node": "^20",
    "drizzle-kit": "^0.30.0",
    "typescript": "^5",
    "vitest": "^2.0.0"
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "clean": "rm -rf dist node_modules"
  }
}
```

**Step 3: 创建 schema 测试文件**

```typescript
// packages/core/src/db/schema.test.ts
import { describe, it, expect } from "vitest";
import { workspaces, agentDefinitions } from "./schema";

describe("Database Schema", () => {
  it("should have workspaces table defined", () => {
    expect(workspaces).toBeDefined();
    expect(workspaces.name).toBeDefined();
  });

  it("should have agentDefinitions table defined", () => {
    expect(agentDefinitions).toBeDefined();
    expect(agentDefinitions.name).toBeDefined();
  });
});
```

**Step 4: 安装测试依赖并运行**

```bash
# 安装依赖
cd packages/core
pnpm add -D vitest

# 运行测试
pnpm test

# 期望输出: 测试通过
```

**Step 5: 提交**

```bash
git add vitest.config.ts packages/core/
git commit -m "chore: setup vitest testing framework"
```

---

## Task 13: 创建 GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: 创建 CI 工作流**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: agent_platform_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install

      - name: Run linter
        run: pnpm lint

      - name: Run tests
        run: pnpm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/agent_platform_test
          REDIS_URL: redis://localhost:6379
```

**Step 2: 提交**

```bash
git add .github/workflows/ci.yml
git commit -m "chore: add github actions ci workflow"
```

---

## Task 14: 创建 API 文档

**Files:**
- Create: `apps/web/app/api-doc/page.tsx`
- Create: `apps/web/lib/api-routes.ts`

**Step 1: 创建 API 路由定义**

```typescript
// apps/web/lib/api-routes.ts
export const apiRoutes = [
  {
    method: "GET",
    path: "/api/agents",
    description: "获取所有 Agent 定义",
    response: "AgentDefinition[]",
  },
  {
    method: "POST",
    path: "/api/agents",
    description: "创建新的 Agent 定义",
    body: "AgentConfig",
    response: "AgentDefinition",
  },
  {
    method: "GET",
    path: "/api/workflows",
    description: "获取所有工作流定义",
    response: "WorkflowDefinition[]",
  },
  {
    method: "POST",
    path: "/api/workflows",
    description: "创建新的工作流定义",
    body: "WorkflowConfig",
    response: "WorkflowDefinition",
  },
];
```

**Step 2: 创建 API 文档页面**

```tsx
// apps/web/app/api-doc/page.tsx
import { apiRoutes } from "@/lib/api-routes";

export default function ApiDocPage() {
  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">API 文档</h1>
      
      <div className="space-y-6">
        {apiRoutes.map((route, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                {route.method}
              </span>
              <code className="text-lg">{route.path}</code>
            </div>
            <p className="text-gray-600">{route.description}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
```

**Step 3: 提交**

```bash
git add apps/web/app/api-doc/ apps/web/lib/api-routes.ts
git commit -m "docs: add api documentation page"
```

---

## Task 15: Phase 1 最终验证

**验证清单：**

```bash
# 1. 清理并重新安装依赖
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install

# 2. 验证 TypeScript 编译
pnpm build

# 3. 启动开发环境
docker-compose up -d
pnpm dev

# 4. 运行测试
pnpm test

# 5. 验证 API
# 访问 http://localhost:3000/api/agents 应该返回 []
# 访问 http://localhost:3000/api-doc 应该显示 API 文档

# 6. 验证数据库
cd packages/core
pnpm db:studio
# 应该能看到所有表结构
```

---

## 验收标准

Phase 1 完成时，系统应该能够：

- [x] `pnpm install` 安装所有依赖
- [x] `pnpm dev` 启动 Next.js 开发服务器
- [x] `pnpm test` 运行单元测试并通过
- [x] `pnpm db:migrate` 执行数据库迁移
- [x] 访问 `http://localhost:3000` 显示首页
- [x] 访问 `http://localhost:3000/api-doc` 显示 API 文档
- [x] API 端点可正常响应
- [x] Git 仓库有清晰的提交历史

---

## 下一步

Phase 1 完成后，使用 **horspowers:executing-plans** 技能逐任务执行此计划，然后进入 Phase 2: Agent Runtime 开发。

