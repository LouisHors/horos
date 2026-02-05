# AI Agent 可视化编排工具 - AI Agent 开发指南

> 本文档面向 AI 编程助手，旨在帮助理解本项目架构、开发规范和最佳实践。

---
## Personal Rules
Always responds in *Simplified-Chinese/中文*

## 项目概述

本项目是一个面向 AI Agent 的可视化编排工具，采用**混合架构设计**（编排层中心化 + 运行时去中心化）。

### 核心能力

| 能力维度 | 具体目标 |
|---------|---------|
| **可视化编排** | 拖拽式画布、丰富的节点类型、实时预览 |
| **多Agent协作** | 支持Agent间通信、任务委派、结果聚合 |
| **自组织调度** | 动态任务分配、负载均衡、弹性伸缩 |
| **上下文流转** | 状态共享、消息传递、记忆管理 |
| **生命周期管理** | Agent创建、初始化、执行、暂停、恢复、销毁 |

### 架构哲学

```
┌─────────────────────────────────────────────────────────────────┐
│                     混合架构：取两者之长                           │
├─────────────────────────────────────────────────────────────────┤
│  编排层 (中心化)              │  运行时层 (去中心化)              │
│  ───────────────              │  ───────────────────              │
│  • 画布可视化编辑             │  • Agent自运行 while(true)        │
│  • 工作流DAG定义              │  • 阻塞等待消息唤醒               │
│  • 执行状态追踪               │  • 人机完全等价                   │
│  • 断点调试支持               │  • 动态创建子Agent                │
│                               │  • 通过IM群聊通信                 │
└─────────────────────────────────────────────────────────────────┘
```

### 项目状态

⚠️ **重要提示**：本项目目前处于**设计阶段**。仓库中包含完整的设计文档，但尚未包含实际源代码实现。

---

## 技术栈

### 前端技术栈

| 组件 | 技术选型 | 版本 | 用途 |
|------|---------|------|------|
| 框架 | React | 18 / 19 | 组件化UI开发 |
| 语言 | TypeScript | 5.x | 类型安全 |
| 状态管理 | Zustand + Immer | 4.x | 全局状态管理，支持时间旅行调试 |
| UI组件库 | Ant Design / Tailwind + shadcn/ui | 5.x / 4.x | 企业级UI组件 |
| 画布引擎 | ReactFlow / @xyflow/react | 12.x | 节点图可视化编辑 |
| 布局引擎 | Dagre / Elk.js | - | 自动布局算法 |
| 构建工具 | Vite / Next.js | - | 快速构建和HMR |
| 动画 | Framer Motion | 11.x | 流畅交互动效 |

### 后端技术栈

| 组件 | 技术选型 | 版本 | 用途 |
|------|---------|------|------|
| 运行时 | Bun / Node.js | 1.x / 18+ | JavaScript/TypeScript 运行时 |
| Web框架 | FastAPI / Next.js Route Handlers | - | API服务 |
| ORM | Drizzle ORM / SQLAlchemy | 0.45 / 2.x | 数据库访问 |
| 任务队列 | Celery / Redis Streams | - | 异步任务处理 |
| 缓存 | Redis | 7.x | 缓存、消息、状态 |
| 消息队列 | RabbitMQ | 3.x | 可靠消息传递 |
| 事件流 | Kafka / Redis Streams | - | 事件总线 |

### 数据存储

| 存储类型 | 技术 | 用途 |
|---------|------|------|
| 关系数据库 | PostgreSQL 16 | 元数据、工作流定义、执行记录 |
| 内存缓存 | Redis 7 | 运行时状态、会话、分布式锁 |
| 对象存储 | MinIO / S3 | 工作流文件、Agent镜像、日志归档 |
| 时序数据库 | ClickHouse | 执行指标、性能数据、审计日志 |

### 基础设施

| 类别 | 技术选型 |
|------|---------|
| 容器化 | Docker |
| 编排 | Kubernetes |
| API网关 | Kong / Nginx Ingress |
| 监控 | Prometheus + Grafana |
| 日志 | ELK Stack / Loki |
| 追踪 | Jaeger |

---

## 项目结构

```
horos/
├── AGENTS.md                      # 本文件
├── architecture_design.md         # 系统架构设计文档 (126KB)
├── frontend_design.md             # 前端设计方案 (77KB)
├── backend_engine_design.md       # 后端执行引擎设计 (111KB)
├── data_model_design.md           # 数据模型设计 (66KB)
├── devops_design.md               # DevOps部署运维方案 (78KB)
├── AI_Agent_Visual_Orchestration_Hybrid_Solution.md  # 混合架构技术方案 (82KB)
└── devops/                        # 部署配置
    ├── docker-compose.yaml        # Docker Compose 开发环境配置
    ├── docker/                    # Dockerfile 模板
    │   ├── frontend.Dockerfile
    │   ├── backend.Dockerfile
    │   ├── engine.Dockerfile
    │   └── engine-requirements.txt
    ├── k8s/                       # Kubernetes 生产环境配置
    │   ├── namespace.yaml
    │   ├── configmap.yaml
    │   ├── secret.yaml
    │   ├── frontend-deployment.yaml
    │   ├── backend-deployment.yaml
    │   ├── engine-deployment.yaml
    │   ├── services.yaml
    │   ├── ingress.yaml
    │   ├── hpa.yaml
    │   ├── storage.yaml
    │   └── kustomization.yaml
    ├── .github/workflows/         # CI/CD 工作流
    │   └── ci-cd.yaml
    ├── monitoring/                # 监控配置
    │   ├── prometheus-config.yaml
    │   └── alertmanager-config.yaml
    └── scripts/                   # 运维脚本
        ├── setup-dev-env.sh
        ├── ops-commands.sh
        └── troubleshoot.sh
```

---

## 构建和运行

### 开发环境（Docker Compose）

```bash
# 1. 进入 devops 目录
cd devops

# 2. 启动所有服务
docker-compose up -d

# 3. 查看服务状态
docker-compose ps

# 4. 查看日志
docker-compose logs -f [service-name]

# 5. 停止服务
docker-compose down
```

**开发环境服务端口映射：**

| 服务 | 端口 | 说明 |
|------|------|------|
| Frontend | 3000 | React 前端应用 |
| Backend API | 8080 | RESTful API 服务 |
| Execution Engine | 8082 | 工作流执行引擎 |
| PostgreSQL | 5432 | 数据库 |
| Redis | 6379 | 缓存服务 |
| RabbitMQ | 5672 / 15672 | 消息队列 / 管理界面 |
| MinIO | 9000 / 9001 | 对象存储 / 管理界面 |
| Prometheus | 9090 | 指标采集 |
| Grafana | 3001 | 监控仪表盘 |
| Loki | 3100 | 日志聚合 |

### 生产环境（Kubernetes）

```bash
# 1. 应用 Kustomization 配置
kubectl apply -k devops/k8s/

# 2. 验证部署
kubectl get pods -n ai-agent-prod
kubectl get svc -n ai-agent-prod
kubectl get ingress -n ai-agent-prod

# 3. 查看日志
kubectl logs -f deployment/frontend -n ai-agent-prod
```

---

## 代码风格指南

### 前端代码规范

1. **TypeScript 严格模式**：所有代码必须使用 TypeScript，启用 `strict` 模式
2. **组件命名**：使用 PascalCase，如 `FlowEditor`, `NodeLibrary`
3. **Hook 命名**：使用 camelCase 前缀 `use`，如 `useFlowState`, `useNodeRegistry`
4. **接口命名**：使用 `Props` 后缀，如 `FlowEditorProps`, `NodeData`
5. **状态管理**：使用 Zustand，避免直接使用 useState 管理复杂状态

```typescript
// ✅ 推荐的组件结构
interface AgentNodeProps {
  id: string;
  data: AgentNodeData;
  selected?: boolean;
}

export const AgentNode: React.FC<AgentNodeProps> = ({ id, data, selected }) => {
  // 使用 Zustand 获取状态
  const { updateNodeData } = useFlowStore();

  // 使用自定义 Hook
  const { executeAgent } = useAgentExecution(id);

  return (
    <div className={cn('agent-node', selected && 'selected')}>
      {/* 组件内容 */}
    </div>
  );
};
```

### 后端代码规范

1. **Python 类型注解**：所有函数必须添加类型注解
2. **异步优先**：使用 `async/await` 处理 I/O 操作
3. **Pydantic 模型**：使用 Pydantic 进行数据验证
4. **FastAPI 路由**：使用依赖注入管理共享资源

```python
# ✅ 推荐的 Python 代码结构
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends

class AgentConfig(BaseModel):
    name: str
    model: str = "gpt-4"
    temperature: float = 0.7

class AgentManager:
    async def create_agent(self, config: AgentConfig) -> Agent:
        ...

router = APIRouter()

@router.post("/agents", response_model=AgentResponse)
async def create_agent(
    config: AgentConfig,
    manager: AgentManager = Depends(get_agent_manager)
) -> AgentResponse:
    """创建新的 Agent 实例"""
    agent = await manager.create_agent(config)
    return AgentResponse.from_agent(agent)
```

---

## 测试策略

### 测试分层

```
┌─────────────────────────────────────────────────────────────┐
│                        测试金字塔                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│     /\\                                                      │
│    /  \\         E2E 测试 (少量)                             │
│   /____\\        - 用户工作流测试                             │
│  /      \\       - 端到端场景                                 │
│ /        \\                                                 │
├─────────────────────────────────────────────────────────────┤
│    ______                                                   │
│   /      \\      集成测试 (中量)                             │
│  /________\\     - API 集成测试                               │
│ /          \\    - 数据库集成                                 │
│/            \\   - 服务间通信                                 │
├─────────────────────────────────────────────────────────────┤
│  ___________                                                │
│ /           \\   单元测试 (大量)                             │
│/_____________\\  - 函数/组件单元测试                          │
│               \  - 工具函数测试                               │
│                \ - 纯逻辑测试                                 │
└─────────────────────────────────────────────────────────────┘
```

### 运行测试

```bash
# 单元测试
npm run test:unit

# 集成测试（需要启动测试数据库）
npm run test:integration

# E2E 测试
npm run test:e2e

# 覆盖率报告
npm run test:coverage
```

---

## CI/CD 流程

### GitHub Actions 工作流

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Push      │────►│   Lint &     │────►│  Security    │
│   / PR       │     │   Format     │     │   Scan       │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                 │
┌──────────────┐     ┌──────────────┐     ┌─────┴───────┐
│   Deploy     │◄────│    Build     │◄────│  Unit Test  │
│  (Dev/Prod)  │     │   Images     │     │  + Coverage │
└──────────────┘     └──────────────┘     └─────────────┘
```

### 部署环境

| 环境 | 触发条件 | 策略 |
|------|---------|------|
| 开发环境 (Dev) | `develop` 分支推送 | 自动部署 |
| 测试环境 (Staging) | `main` 分支推送 | 自动部署 + Smoke Test |
| 生产环境 (Prod) | Tag `v*` 推送 | 金丝雀发布 (Canary) |

### 金丝雀发布流程

1. 部署 Canary 版本（10% 流量）
2. 观察 5 分钟错误率
3. 错误率 < 1% 则全量部署
4. 错误率 >= 1% 自动回滚

---

## 扩展点与插件机制

### 节点类型扩展

```typescript
// 自定义节点注册示例
import { BaseNode, registerNode } from '@/core/nodes';

@registerNode({
  type: 'custom.data_transform',
  category: 'data',
  icon: 'transform',
  description: '数据转换节点'
})
class DataTransformNode extends BaseNode {
  getInputSchema() {
    return {
      data: { type: 'object', required: true },
      transform_type: {
        type: 'string',
        enum: ['map', 'filter', 'reduce']
      }
    };
  }

  async execute(context: ExecutionContext): Promise<NodeResult> {
    const data = context.getInput('data');
    const transformType = this.config.transform_type;

    // 执行转换逻辑
    const result = await this.transform(data, transformType);

    return { output: result };
  }
}
```

### Agent 类型扩展

```python
# 自定义 Agent 注册示例
from core.agents import BaseAgent, register_agent

@register_agent(
    type="custom.researcher",
    description="研究型Agent，擅长信息收集和分析"
)
class ResearcherAgent(BaseAgent):
    async def execute(self, task: Task, context: Context) -> TaskResult:
        # 1. 理解任务
        query = task.description

        # 2. 搜索信息
        search_results = await self.search_tool.run(query)

        # 3. 分析信息
        analysis = await self.analysis_tool.run(search_results)

        return TaskResult(
            output={
                "report": analysis.report,
                "sources": search_results.sources
            }
        )
```

---

## 安全注意事项

### 1. 密钥管理

- **永远不要**将生产密钥提交到代码仓库
- 使用 Kubernetes Secrets 或 Vault 管理敏感配置
- 本地开发使用 `.env.local`（已添加到 `.gitignore`）

### 2. LLM API 安全

- 实施 API 密钥轮换机制
- 设置 API 调用配额和速率限制
- 记录所有 LLM 调用用于审计

### 3. 代码执行安全

- 代码执行节点（CodeNode）必须在沙箱环境中运行
- 禁用危险系统调用
- 设置执行超时和资源限制

### 4. 数据安全

- 敏感数据使用加密存储（PostgreSQL 加密 + MinIO 服务端加密）
- 传输层使用 TLS 1.3
- 实施字段级加密存储 API 密钥

---

## 故障排查

### 常用命令

```bash
# 检查 Pod 状态
kubectl get pods -n ai-agent-prod

# 查看 Pod 日志
kubectl logs -f deployment/backend-api -n ai-agent-prod

# 进入 Pod 调试
kubectl exec -it deployment/backend-api -n ai-agent-prod -- /bin/sh

# 检查服务连接
kubectl run debug --rm -it --image=curlimages/curl --restart=Never -- curl http://backend-api:3000/health
```

### 常见问题

| 问题 | 可能原因 | 解决方案 |
|------|---------|---------|
| Pod 启动失败 | 资源不足 / 健康检查失败 | 检查资源配额，查看 Pod 事件 |
| 数据库连接超时 | 网络策略 / 连接池耗尽 | 检查网络策略，增加连接池大小 |
| 消息队列堆积 | Consumer 处理慢 / 消费失败 | 增加 Consumer 数量，检查错误日志 |
| LLM 调用失败 | API 密钥失效 / 配额耗尽 | 检查 API 密钥，查看配额使用情况 |

---

## Claude Code Skill 兼容

### horspowers
在 /Users/zego/Zego/horspowers 目录下，是一个完整的，claude code skills 项目，skills/ 子目录包含了所有技能



## 参考文档

- [架构设计文档](./architecture_design.md) - 完整的系统架构设计
- [前端设计文档](./frontend_design.md) - 前端技术方案和组件设计
- [后端引擎设计](./backend_engine_design.md) - 执行引擎和调度器设计
- [数据模型设计](./data_model_design.md) - 数据库设计和数据流
- [DevOps 设计文档](./devops_design.md) - 部署和运维方案
- [混合架构方案](./AI_Agent_Visual_Orchestration_Hybrid_Solution.md) - 融合架构技术方案

---

*本文档基于项目设计文档生成，适用于 AI 编程助手理解项目架构。如有更新需求，请同步修改相关设计文档。*
