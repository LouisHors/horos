# Master Agent 详细设计文档

> 版本: v2.0  
> 日期: 2026-02-06  
> 关联: [系统总览](./SYSTEM_OVERVIEW_V2.md)

---

## 1. 概述

### 1.1 设计目标

Master Agent 是系统的智能入口，负责将用户的自然语言需求转换为可执行的工作流。它不直接执行任务，而是进行**规划、协调和生成**。

### 1.2 核心能力

| 能力 | 说明 | 输出 |
|------|------|------|
| **需求解析** | 理解用户意图，识别任务类型 | RequirementAnalysis |
| **角色规划** | 确定需要的 Agent 角色组合 | RoleAssignment[] |
| **任务拆分** | 将大任务拆分为可分配的子任务 | TaskGraph |
| **工作流生成** | 生成带布局的 ReactFlow 工作流 | WorkflowDSL |

### 1.3 架构位置

```
User Input
    │
    ▼
┌─────────────────────────────────────┐
│         Master Agent Service        │
│  ┌─────────┐ ┌─────────┐ ┌────────┐│
│  │Parser   │ │Planner  │ │Generator││
│  └────┬────┘ └────┬────┘ └───┬────┘│
│       └───────────┴──────────┘      │
│                   │                  │
│              ReviewQueue             │
└───────────────────┼─────────────────┘
                    ▼
               User Review
                    │
                    ▼
            Execution Engine
```

---

## 2. 核心组件

### 2.1 RequirementParser (需求解析器)

**职责**: 将自然语言需求转换为结构化分析

```typescript
// 输入输出定义
interface ParseRequirementInput {
  text: string;           // 用户原始输入
  context?: {
    projectType?: string; // 已知项目类型
    techStack?: string[]; // 已知技术栈约束
  };
}

interface RequirementAnalysis {
  rawText: string;                    // 原始文本
  taskType: TaskType;                 // 任务类型
  features: Feature[];                // 功能点列表
  constraints: Constraint[];          // 约束条件
  complexity: ComplexityLevel;        // 复杂度
  estimatedEffort: EffortEstimate;    // 工作量估算
  suggestedRoles: AgentRole[];        // 建议角色
  ambiguousPoints: string[];          // 模糊点（需要澄清）
  metadata: {
    parsedAt: Date;
    parserVersion: string;
  };
}

type TaskType = 
  | 'webapp'           // Web 应用
  | 'mobile_app'       // 移动应用
  | 'api_service'      // API 服务
  | 'data_pipeline'    // 数据管道
  | 'automation'       // 自动化脚本
  | 'extension'        // 浏览器/IDE 插件
  | 'cli_tool'         // 命令行工具
  | 'library'          // 库/SDK
  | 'unknown';         // 需要澄清

interface Feature {
  id: string;
  description: string;
  priority: 'must' | 'should' | 'could' | 'wont';
  category: 'core' | 'ui' | 'data' | 'integration' | 'security';
}
```

**实现策略**:

```typescript
class RequirementParser {
  private llmService: LLMService;
  
  async parse(input: ParseRequirementInput): Promise<RequirementAnalysis> {
    // Step 1: 使用 LLM 进行初步解析
    const prompt = this.buildPrompt(input);
    const llmResponse = await this.llmService.chat([
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: prompt }
    ]);
    
    // Step 2: 解析 LLM 输出
    const parsed = this.parseLLMResponse(llmResponse.content);
    
    // Step 3: 验证和补充
    return this.validateAndEnrich(parsed);
  }
  
  private buildPrompt(input: ParseRequirementInput): string {
    return `
请分析以下开发需求，提取关键信息：

需求描述：
"""${input.text}"""

请按以下 JSON 格式输出分析结果：
{
  "taskType": "webapp|mobile_app|api_service|...",
  "features": [
    {"description": "功能描述", "priority": "must|should", "category": "core|ui|data"}
  ],
  "constraints": [{"type": "tech|time|resource", "description": "约束描述"}],
  "complexity": "simple|medium|complex",
  "estimatedEffort": {"duration": "2-3天", "storyPoints": 13},
  "suggestedRoles": ["CTO", "PM", "FRONTEND", "BACKEND"],
  "ambiguousPoints": ["需要澄清的问题"]
}

分析要求：
1. 准确识别任务类型
2. 功能点要具体可执行
3. 标记出所有模糊或不明确的地方
4. 复杂度评估要客观
`;
  }
}
```

**系统 Prompt**:

```
你是需求分析专家，擅长从自然语言描述中提取结构化需求。

你的职责：
1. 准确理解用户的开发意图
2. 识别功能点、约束条件、潜在风险
3. 评估工作量和复杂度
4. 指出需要澄清的地方

输出原则：
- 客观准确，不要假设
- 不明确的地方标注出来
- 复杂度评估宁高勿低
- 功能点要可验证
```

---

### 2.2 RolePlanner (角色规划器)

**职责**: 根据需求分析，规划需要的 Agent 角色

```typescript
// 角色定义
interface RoleTemplate {
  id: string;
  name: string;           // 显示名称
  icon: string;           // Emoji 图标
  type: AgentRoleType;
  systemPrompt: string;   // 系统提示词
  capabilities: Capability[];
  outputArtifacts: string[];  // 预期产出物
  dependencies: AgentRoleType[]; // 依赖的其他角色
  canParallelWith: AgentRoleType[]; // 可并行的角色
}

type AgentRoleType = 
  | 'CTO'              // 技术负责人
  | 'PRODUCT_MANAGER'  // 产品经理
  | 'FRONTEND_DEV'     // 前端开发
  | 'BACKEND_DEV'      // 后端开发
  | 'FULLSTACK_DEV'    // 全栈开发
  | 'QA_ENGINEER'      // 测试工程师
  | 'UI_DESIGNER'      // UI设计师
  | 'DEVOPS_ENGINEER'  // DevOps工程师
  | 'DATA_ENGINEER'    // 数据工程师
  | 'SECURITY_EXPERT'  // 安全专家
  | 'CODE_REVIEWER';   // 代码评审员

// 输出
interface RoleAssignment {
  role: RoleTemplate;
  instanceId: string;     // 实例ID
  assignedTasks: Task[];  // 分配的任务
  executionOrder: number; // 执行顺序
  canParallel: boolean;   // 是否可以并行执行
  dependencies: string[]; // 依赖的角色实例ID
}
```

**角色模板库**:

```typescript
const ROLE_TEMPLATES: Record<AgentRoleType, RoleTemplate> = {
  CTO: {
    id: 'role-cto',
    name: 'CTO',
    icon: '🤖',
    type: 'CTO',
    systemPrompt: `你是首席技术官(CTO)，负责系统架构设计和技术决策。

职责：
1. 分析需求并设计系统架构
2. 选择合适的技术栈
3. 定义模块划分和接口规范
4. 评估技术风险

输出要求：
- Architecture.md: 系统架构文档
- TechStack.md: 技术选型说明
- API.md: 接口定义文档

风格：
- 技术判断准确、全面
- 考虑可扩展性和维护性
- 平衡理想方案和实际约束`,
    capabilities: [
      'architecture_design',
      'tech_selection',
      'api_design',
      'risk_assessment',
      'review_code'
    ],
    outputArtifacts: [
      'Architecture.md',
      'TechStack.md', 
      'API.md',
      'DatabaseSchema.md'
    ],
    dependencies: [],
    canParallelWith: ['PRODUCT_MANAGER']
  },
  
  PRODUCT_MANAGER: {
    id: 'role-pm',
    name: '产品经理',
    icon: '📝',
    type: 'PRODUCT_MANAGER',
    systemPrompt: `你是产品经理，负责需求分析和产品定义。

职责：
1. 深入理解用户需求
2. 编写产品需求文档(PRD)
3. 定义用户故事和验收标准
4. 规划功能优先级

输出要求：
- PRD.md: 产品需求文档
- UserStories.md: 用户故事
- AcceptanceCriteria.md: 验收标准

风格：
- 站在用户角度思考
- 需求清晰、可验证
- 优先级合理`,
    capabilities: [
      'requirement_analysis',
      'prd_writing',
      'user_story',
      'priority_planning',
      'acceptance_criteria'
    ],
    outputArtifacts: [
      'PRD.md',
      'UserStories.md',
      'AcceptanceCriteria.md'
    ],
    dependencies: [],
    canParallelWith: ['CTO']
  },
  
  FRONTEND_DEV: {
    id: 'role-frontend',
    name: '前端开发',
    icon: '💻',
    type: 'FRONTEND_DEV',
    systemPrompt: `你是前端开发工程师，负责用户界面实现。

职责：
1. 根据设计稿实现UI
2. 开发可复用的组件
3. 管理前端状态
4. 对接后端API

输出要求：
- src/components/: 组件代码
- src/pages/: 页面代码
- src/hooks/: 自定义Hooks

技术栈：
- React/Vue/Next.js
- TypeScript
- Tailwind CSS
- 状态管理 (Zustand/Redux)

风格：
- 代码整洁、可维护
- 组件设计合理
- 响应式和可访问性`,
    capabilities: [
      'ui_development',
      'component_design',
      'state_management',
      'api_integration',
      'responsive_design'
    ],
    outputArtifacts: [
      'src/components/',
      'src/pages/',
      'src/hooks/',
      'src/styles/'
    ],
    dependencies: ['CTO', 'PRODUCT_MANAGER'],
    canParallelWith: ['BACKEND_DEV']
  },
  
  BACKEND_DEV: {
    id: 'role-backend',
    name: '后端开发',
    icon: '⚙️',
    type: 'BACKEND_DEV',
    systemPrompt: `你是后端开发工程师，负责服务端逻辑实现。

职责：
1. 设计数据库模型
2. 开发API接口
3. 实现业务逻辑
4. 保障数据安全

输出要求：
- src/api/: API路由
- src/models/: 数据模型
- src/services/: 业务逻辑
- src/middleware/: 中间件

技术栈：
- Node.js/Python/Go
- PostgreSQL/MongoDB
- Redis
- RESTful/GraphQL

风格：
- API设计规范
- 性能考虑
- 安全性优先`,
    capabilities: [
      'api_development',
      'database_design',
      'business_logic',
      'security_implementation',
      'performance_optimization'
    ],
    outputArtifacts: [
      'src/api/',
      'src/models/',
      'src/services/',
      'src/middleware/'
    ],
    dependencies: ['CTO'],
    canParallelWith: ['FRONTEND_DEV']
  },
  
  QA_ENGINEER: {
    id: 'role-qa',
    name: 'QA工程师',
    icon: '🧪',
    type: 'QA_ENGINEER',
    systemPrompt: `你是QA工程师，负责测试和质量保障。

职责：
1. 设计测试用例
2. 编写自动化测试
3. 执行测试并报告Bug
4. 评估测试覆盖率

输出要求：
- tests/: 测试代码
- TestPlan.md: 测试计划
- BugReport.md: 缺陷报告

类型：
- 单元测试
- 集成测试
- E2E测试
- 性能测试

风格：
- 覆盖全面
- 用例清晰
- 报告准确`,
    capabilities: [
      'test_design',
      'test_implementation',
      'bug_report',
      'coverage_analysis',
      'performance_testing'
    ],
    outputArtifacts: [
      'tests/',
      'TestPlan.md',
      'BugReport.md'
    ],
    dependencies: ['FRONTEND_DEV', 'BACKEND_DEV'],
    canParallelWith: []
  },
  
  CODE_REVIEWER: {
    id: 'role-reviewer',
    name: '代码评审',
    icon: '👀',
    type: 'CODE_REVIEWER',
    systemPrompt: `你是代码评审专家，负责代码质量把控。

职责：
1. 审查代码规范
2. 识别潜在问题
3. 建议优化方案
4. 确保最佳实践

输出要求：
- ReviewComments.md: 评审意见
- 直接在代码中标注

检查项：
- 代码风格
- 设计模式
- 性能问题
- 安全隐患
- 可维护性

风格：
- 专业、客观
- 建设性意见
- 优先级明确`,
    capabilities: [
      'code_review',
      'best_practices',
      'refactoring_suggestion',
      'security_audit',
      'performance_review'
    ],
    outputArtifacts: [
      'ReviewComments.md'
    ],
    dependencies: ['FRONTEND_DEV', 'BACKEND_DEV'],
    canParallelWith: ['QA_ENGINEER']
  }
};
```

**角色规划算法**:

```typescript
class RolePlanner {
  async plan(analysis: RequirementAnalysis): Promise<RoleAssignment[]> {
    const assignments: RoleAssignment[] = [];
    
    // Step 1: 根据任务类型选择基础角色组合
    const baseRoles = this.selectBaseRoles(analysis.taskType);
    
    // Step 2: 根据功能点补充特定角色
    const additionalRoles = this.selectAdditionalRoles(analysis.features);
    
    // Step 3: 合并去重
    const allRoles = this.mergeRoles([...baseRoles, ...additionalRoles]);
    
    // Step 4: 确定执行顺序和依赖
    const orderedRoles = this.determineExecutionOrder(allRoles);
    
    // Step 5: 标记可并行角色
    return this.markParallelRoles(orderedRoles);
  }
  
  private selectBaseRoles(taskType: TaskType): AgentRoleType[] {
    const roleMap: Record<TaskType, AgentRoleType[]> = {
      'webapp': ['CTO', 'PRODUCT_MANAGER', 'FRONTEND_DEV', 'BACKEND_DEV', 'QA_ENGINEER'],
      'mobile_app': ['CTO', 'PRODUCT_MANAGER', 'FRONTEND_DEV', 'BACKEND_DEV', 'QA_ENGINEER'],
      'api_service': ['CTO', 'PRODUCT_MANAGER', 'BACKEND_DEV', 'QA_ENGINEER'],
      'data_pipeline': ['CTO', 'DATA_ENGINEER', 'BACKEND_DEV'],
      'automation': ['CTO', 'BACKEND_DEV'],
      'extension': ['CTO', 'PRODUCT_MANAGER', 'FRONTEND_DEV'],
      'cli_tool': ['CTO', 'BACKEND_DEV'],
      'library': ['CTO', 'BACKEND_DEV', 'QA_ENGINEER'],
      'unknown': ['CTO', 'PRODUCT_MANAGER'] // 先分析再决定
    };
    return roleMap[taskType] || roleMap['unknown'];
  }
  
  private determineExecutionOrder(roles: RoleTemplate[]): RoleAssignment[] {
    // 拓扑排序，确保依赖的角色先执行
    const graph = this.buildDependencyGraph(roles);
    const sorted = this.topologicalSort(graph);
    
    return sorted.map((role, index) => ({
      role,
      instanceId: generateId(),
      assignedTasks: [],
      executionOrder: index,
      canParallel: false, // 后续计算
      dependencies: [] // 后续计算
    }));
  }
}
```

---

### 2.3 TaskDecomposer (任务拆分器)

**职责**: 将大任务拆分为可分配给各角色的子任务

```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;     // Agent实例ID
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedDuration: number; // 分钟
  dependencies: string[]; // 依赖的任务ID
  inputs: TaskInput[];
  outputs: TaskOutput[];
  acceptanceCriteria: string[];
}

interface TaskGraph {
  tasks: Task[];
  edges: { from: string; to: string; type: 'dependency' | 'input' }[];
  parallelGroups: string[][]; // 可并行执行的任务组
  criticalPath: string[];     // 关键路径
}

class TaskDecomposer {
  async decompose(
    analysis: RequirementAnalysis,
    roles: RoleAssignment[]
  ): Promise<TaskGraph> {
    // Step 1: 为每个角色生成子任务
    const allTasks: Task[] = [];
    
    for (const role of roles) {
      const tasks = await this.generateTasksForRole(role, analysis);
      allTasks.push(...tasks);
    }
    
    // Step 2: 建立任务依赖关系
    const edges = this.buildTaskDependencies(allTasks, roles);
    
    // Step 3: 识别并行组
    const parallelGroups = this.identifyParallelGroups(allTasks, edges);
    
    // Step 4: 计算关键路径
    const criticalPath = this.calculateCriticalPath(allTasks, edges);
    
    return {
      tasks: allTasks,
      edges,
      parallelGroups,
      criticalPath
    };
  }
  
  private async generateTasksForRole(
    role: RoleAssignment,
    analysis: RequirementAnalysis
  ): Promise<Task[]> {
    const prompt = `
你是${role.role.name}，请根据以下需求分析，列出你需要完成的所有任务。

需求分析：
- 任务类型: ${analysis.taskType}
- 功能点: ${analysis.features.map(f => f.description).join(', ')}
- 复杂度: ${analysis.complexity}

请按以下格式列出任务：
1. [任务标题] - [简要描述] - [预计时间]
2. ...

要求：
- 任务要具体、可执行
- 每个任务有明确的产出物
- 任务粒度适中（2-4小时/个）
- 考虑前置依赖
`;

    const response = await this.llmService.chat([
      { role: 'system', content: role.role.systemPrompt },
      { role: 'user', content: prompt }
    ]);
    
    return this.parseTasks(response.content, role.instanceId);
  }
}
```

---

### 2.4 WorkflowGenerator (工作流生成器)

**职责**: 将任务图转换为可视化的 ReactFlow 工作流

```typescript
interface WorkflowDSL {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  viewport: { x: number; y: number; zoom: number };
  metadata: {
    name: string;
    description: string;
    generatedAt: Date;
    generatedBy: string;
  };
}

interface WorkflowNode {
  id: string;
  type: 'start' | 'end' | 'agent' | 'decision' | 'parallel' | 'merge';
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    role?: string;          // Agent角色
    agentId?: string;       // 分配的Agent实例ID
    taskId?: string;        // 关联的任务ID
    config?: Record<string, any>; // 节点配置
  };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: 'default' | 'conditional';
  label?: string;
  animated?: boolean;
}

class WorkflowGenerator {
  async generate(
    taskGraph: TaskGraph,
    roles: RoleAssignment[]
  ): Promise<WorkflowDSL> {
    // Step 1: 创建节点
    const nodes = this.createNodes(taskGraph, roles);
    
    // Step 2: 创建边
    const edges = this.createEdges(taskGraph);
    
    // Step 3: 自动布局
    const layouted = await this.autoLayout(nodes, edges);
    
    // Step 4: 添加元数据
    return {
      nodes: layouted.nodes,
      edges: layouted.edges,
      viewport: { x: 0, y: 0, zoom: 1 },
      metadata: {
        name: this.generateName(taskGraph),
        description: this.generateDescription(taskGraph),
        generatedAt: new Date(),
        generatedBy: 'master_agent'
      }
    };
  }
  
  private createNodes(
    taskGraph: TaskGraph,
    roles: RoleAssignment[]
  ): WorkflowNode[] {
    const nodes: WorkflowNode[] = [];
    
    // Start 节点
    nodes.push({
      id: 'start',
      type: 'start',
      position: { x: 0, y: 0 },
      data: { label: '开始' }
    });
    
    // 为每个任务创建 Agent 节点
    for (const task of taskGraph.tasks) {
      const role = roles.find(r => r.instanceId === task.assignedTo);
      nodes.push({
        id: task.id,
        type: 'agent',
        position: { x: 0, y: 0 }, // 布局算法会重新计算
        data: {
          label: `${role?.role.icon} ${task.title}`,
          description: task.description,
          role: role?.role.name,
          agentId: task.assignedTo,
          taskId: task.id,
          config: {
            systemPrompt: role?.role.systemPrompt,
            expectedOutput: task.outputs
          }
        }
      });
    }
    
    // End 节点
    nodes.push({
      id: 'end',
      type: 'end',
      position: { x: 0, y: 0 },
      data: { label: '完成' }
    });
    
    return nodes;
  }
  
  private async autoLayout(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): Promise<{ nodes: WorkflowNode[]; edges: WorkflowEdge[] }> {
    // 使用 Dagre 或 Elk.js 进行自动布局
    const graph = new dagre.graphlib.Graph();
    graph.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 150 });
    graph.setDefaultEdgeLabel(() => ({}));
    
    // 添加节点和边...
    
    dagre.layout(graph);
    
    // 更新节点位置
    const layoutedNodes = nodes.map(node => {
      const graphNode = graph.node(node.id);
      return {
        ...node,
        position: { x: graphNode.x, y: graphNode.y }
      };
    });
    
    return { nodes: layoutedNodes, edges };
  }
}
```

---

## 3. 审核队列机制

### 3.1 审核状态流转

```
生成完成
    │
    ▼
┌──────────┐
│ PENDING  │◀────────────────┐
│ (待审核) │                 │
└────┬─────┘                 │
     │                       │
     ├──────────┬───────────┤
     │          │           │
     ▼          ▼           │
┌────────┐ ┌────────┐      │
│APPROVED│ │REJECTED│      │
└────┬───┘ └────────┘      │
     │                      │
     ▼                      │
┌──────────┐               │
│EXECUTING │               │
└────┬─────┘               │
     │                      │
     ▼                      │
┌──────────┐               │
│MODIFIED  │───────────────┘
│(用户修改)│
└──────────┘
```

### 3.2 ReviewQueue 存储

```typescript
interface ReviewQueueItem {
  id: string;
  projectId: string;
  status: 'pending' | 'approved' | 'rejected' | 'modified' | 'executing';
  
  // 生成的内容
  generatedWorkflow: WorkflowDSL;
  generatedRoles: RoleAssignment[];
  generatedTasks: TaskGraph;
  
  // 用户反馈
  reviewerFeedback?: string;
  modifiedWorkflow?: WorkflowDSL; // 用户修改后的版本
  
  // 时间戳
  createdAt: Date;
  reviewedAt?: Date;
  executedAt?: Date;
}

// 数据库表
CREATE TABLE review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  status VARCHAR(20) NOT NULL,
  
  generated_workflow JSONB NOT NULL,
  generated_roles JSONB NOT NULL,
  generated_tasks JSONB NOT NULL,
  
  reviewer_feedback TEXT,
  modified_workflow JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  executed_at TIMESTAMP
);
```

---

## 4. API 接口

### 4.1 Master Agent API

```typescript
// POST /api/v2/master/analyze
// 分析需求
interface AnalyzeRequest {
  text: string;
  context?: {
    projectType?: string;
    techStack?: string[];
  };
}

interface AnalyzeResponse {
  analysis: RequirementAnalysis;
}

// POST /api/v2/master/plan
// 生成执行计划
interface PlanRequest {
  analysis: RequirementAnalysis;
}

interface PlanResponse {
  roles: RoleAssignment[];
  tasks: TaskGraph;
  workflow: WorkflowDSL;
  reviewQueueId: string;
}

// POST /api/v2/master/review/:id/approve
// 批准执行计划
interface ApproveResponse {
  executionId: string;
  message: string;
}

// POST /api/v2/master/review/:id/reject
// 拒绝执行计划
interface RejectRequest {
  feedback: string;
}

// POST /api/v2/master/review/:id/modify
// 修改后提交
interface ModifyRequest {
  modifiedWorkflow: WorkflowDSL;
  feedback?: string;
}
```

---

## 5. 错误处理

### 5.1 常见错误场景

| 错误类型 | 场景 | 处理策略 |
|---------|------|---------|
| **需求不清晰** | LLM无法确定任务类型 | 返回 clarifyingQuestions，要求用户补充 |
| **生成失败** | LLM输出格式错误 | 重试3次，失败则返回错误提示 |
| **角色冲突** | 依赖关系形成循环 | 检测并打破循环，标记警告 |
| **任务过大** | 单任务超过8小时 | 自动拆分为子任务 |
| **资源不足** | 需要的角色未定义 | 使用通用角色替代，标记警告 |

---

## 6. 性能优化

### 6.1 缓存策略

```typescript
class MasterAgentCache {
  // 相似需求缓存
  private similarityCache: Map<string, CachedResult>;
  
  async checkSimilarity(text: string): Promise<CachedResult | null> {
    const embedding = await this.getEmbedding(text);
    const similar = await this.vectorSearch(embedding);
    
    if (similar.score > 0.9) {
      return similar.result; // 复用生成结果
    }
    return null;
  }
}
```

### 6.2 流式生成

对于复杂任务，支持流式返回生成进度:

```typescript
// WebSocket /ws/v2/master/generate
// 实时推送生成进度
{
  type: 'progress',
  stage: 'parsing' | 'planning' | 'decomposing' | 'generating',
  progress: 0-100,
  message: '正在分析需求...'
}
```

---

## 7. 测试策略

| 测试类型 | 内容 | 工具 |
|---------|------|------|
| 单元测试 | 各组件独立测试 | Jest |
| 集成测试 | 完整流程测试 | 自定义脚本 |
| 质量测试 | 生成结果质量评估 | LLM评分 |
| 性能测试 | 生成耗时、并发 | k6 |

---

**下一步**: 实现 MasterAgent 核心类，开始 Phase A 开发。
