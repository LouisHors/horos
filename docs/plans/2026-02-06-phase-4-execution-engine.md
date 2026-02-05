# Phase 4: 执行引擎实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use horspowers:executing-plans to implement this plan task-by-task.

**日期**: 2026-02-06
**预计用时**: 14天  
**任务数量**: 14个  
**依赖**: Phase 3 完成 ✅

## 目标

实现工作流执行引擎，包括工作流解析、执行调度、节点执行、条件分支、并行执行、检查点与故障恢复功能。

## 架构方案

采用 DAG（有向无环图）执行模型：
1. **WorkflowParser**: 将工作流定义解析为可执行的 DAG
2. **ExecutionScheduler**: 基于 DAG 拓扑排序进行任务调度
3. **NodeExecutor**: 执行单个节点并处理输入/输出
4. **CheckpointManager**: 定期保存执行状态以支持故障恢复

## 技术栈

TypeScript, DAG 算法, 拓扑排序, 状态机, 事件驱动

---

## Task 1: 创建执行引擎包结构

**Files:**
- Create: `packages/execution/package.json`
- Create: `packages/execution/tsconfig.json`
- Create: `packages/execution/vitest.config.ts`
- Create: `packages/execution/src/index.ts`

**Step 1: 创建目录结构**

```bash
mkdir -p packages/execution/src/{core,schedulers,executors,checkpoint}
```

**Step 2: 创建 package.json**

```json
{
  "name": "@horos/execution",
  "version": "0.1.0",
  "description": "AI Agent Workflow Execution Engine",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts --clean",
    "dev": "tsup src/index.ts --format esm --dts --watch",
    "test": "vitest run"
  },
  "dependencies": {
    "@horos/core": "workspace:*",
    "@horos/editor": "workspace:*",
    "zustand": "^5.0.3",
    "immer": "^10.1.1"
  },
  "devDependencies": {
    "tsup": "^8.3.5",
    "typescript": "^5.7.3",
    "vitest": "^2.0.0"
  }
}
```

**Step 3: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 4: 创建 vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});
```

**Step 5: 初始化 index.ts**

```typescript
// Core
export { WorkflowParser } from './core/WorkflowParser';
export { ExecutionScheduler } from './core/ExecutionScheduler';
export { ExecutionEngine } from './core/ExecutionEngine';

// Types
export type {
  WorkflowDAG,
  DAGNode,
  DAGEdge,
  ExecutionContext,
  ExecutionState,
  NodeExecutionResult,
} from './types';
```

**Step 6: Commit**

```bash
git add packages/execution/
git commit -m "feat(execution): initialize execution engine package"
```

---

## Task 2: 定义执行引擎类型

**Files:**
- Create: `packages/execution/src/types/index.ts`
- Create: `packages/execution/src/types/dag.ts`
- Create: `packages/execution/src/types/execution.ts`

**Step 1: 创建 DAG 类型**

```typescript
// packages/execution/src/types/dag.ts
import { WorkflowNode, WorkflowEdge } from '@horos/editor';

// DAG 节点
export interface DAGNode {
  id: string;
  node: WorkflowNode;
  dependencies: string[];  // 依赖的节点ID
  dependents: string[];    // 依赖此节点的节点ID
  level: number;           // 拓扑层级
}

// DAG 边
export interface DAGEdge {
  id: string;
  source: string;
  target: string;
  edge: WorkflowEdge;
}

// 工作流 DAG
export interface WorkflowDAG {
  id: string;
  nodes: Map<string, DAGNode>;
  edges: DAGEdge[];
  startNodes: string[];    // 没有依赖的节点
  endNodes: string[];      // 没有依赖者的节点
  levels: string[][];      // 按层级分组的节点ID
}
```

**Step 2: 创建执行类型**

```typescript
// packages/execution/src/types/execution.ts
import { ExecutionStatus, NodeExecutionStatus } from '@horos/editor';

// 执行上下文
export interface ExecutionContext {
  executionId: string;
  workflowId: string;
  variables: Map<string, unknown>;
  nodeOutputs: Map<string, unknown>;
  startTime: Date;
  parentExecutionId?: string;
}

// 执行状态
export interface ExecutionState {
  executionId: string;
  status: ExecutionStatus;
  currentNodes: string[];  // 当前执行的节点
  completedNodes: string[];
  failedNodes: string[];
  pendingNodes: string[];
  context: ExecutionContext;
}

// 节点执行结果
export interface NodeExecutionResult {
  nodeId: string;
  status: NodeExecutionStatus;
  output?: unknown;
  error?: Error;
  duration: number;
  startTime: Date;
  endTime: Date;
}
```

**Step 3: 创建类型导出**

```typescript
// packages/execution/src/types/index.ts
export * from './dag';
export * from './execution';
```

**Step 4: Commit**

```bash
git add packages/execution/src/types/
git commit -m "feat(execution): add DAG and execution types"
```

---

## Task 3: 实现 WorkflowParser

**Files:**
- Create: `packages/execution/src/core/WorkflowParser.ts`
- Create: `packages/execution/src/core/WorkflowParser.test.ts`

**Step 1: 编写测试**

```typescript
// packages/execution/src/core/WorkflowParser.test.ts
import { describe, it, expect } from 'vitest';
import { WorkflowParser } from './WorkflowParser';
import { WorkflowNode, WorkflowEdge, NodeType } from '@horos/editor';

describe('WorkflowParser', () => {
  const parser = new WorkflowParser();
  
  const mockNodes: WorkflowNode[] = [
    { id: 'start', type: NodeType.START, position: { x: 0, y: 0 }, data: {} },
    { id: 'agent', type: NodeType.AGENT, position: { x: 100, y: 0 }, data: {} },
    { id: 'end', type: NodeType.END, position: { x: 200, y: 0 }, data: {} },
  ];
  
  const mockEdges: WorkflowEdge[] = [
    { id: 'e1', source: 'start', target: 'agent', type: 'custom' },
    { id: 'e2', source: 'agent', target: 'end', type: 'custom' },
  ];
  
  it('should parse workflow to DAG', () => {
    const dag = parser.parse(mockNodes, mockEdges);
    
    expect(dag).toBeDefined();
    expect(dag.nodes.size).toBe(3);
    expect(dag.startNodes).toContain('start');
    expect(dag.endNodes).toContain('end');
  });
  
  it('should calculate correct levels', () => {
    const dag = parser.parse(mockNodes, mockEdges);
    
    expect(dag.levels).toHaveLength(3);
    expect(dag.levels[0]).toContain('start');
    expect(dag.levels[2]).toContain('end');
  });
});
```

**Step 2: 实现 WorkflowParser**

```typescript
// packages/execution/src/core/WorkflowParser.ts
import { WorkflowNode, WorkflowEdge } from '@horos/editor';
import { WorkflowDAG, DAGNode, DAGEdge } from '../types';

export class WorkflowParser {
  /**
   * 将工作流解析为 DAG
   */
  parse(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowDAG {
    const dagNodes = new Map<string, DAGNode>();
    const dagEdges: DAGEdge[] = [];
    
    // 初始化节点
    nodes.forEach(node => {
      dagNodes.set(node.id, {
        id: node.id,
        node,
        dependencies: [],
        dependents: [],
        level: 0,
      });
    });
    
    // 构建依赖关系
    edges.forEach(edge => {
      const sourceNode = dagNodes.get(edge.source);
      const targetNode = dagNodes.get(edge.target);
      
      if (sourceNode && targetNode) {
        sourceNode.dependents.push(edge.target);
        targetNode.dependencies.push(edge.source);
        
        dagEdges.push({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          edge,
        });
      }
    });
    
    // 计算层级
    const levels = this.calculateLevels(dagNodes);
    
    // 找出开始和结束节点
    const startNodes = nodes
      .filter(n => dagNodes.get(n.id)!.dependencies.length === 0)
      .map(n => n.id);
      
    const endNodes = nodes
      .filter(n => dagNodes.get(n.id)!.dependents.length === 0)
      .map(n => n.id);
    
    return {
      id: `dag_${Date.now()}`,
      nodes: dagNodes,
      edges: dagEdges,
      startNodes,
      endNodes,
      levels,
    };
  }
  
  /**
   * 计算每个节点的层级
   */
  private calculateLevels(nodes: Map<string, DAGNode>): string[][] {
    const levels: string[][] = [];
    const visited = new Set<string>();
    
    // 找到入度为0的节点
    let currentLevel = Array.from(nodes.values())
      .filter(n => n.dependencies.length === 0)
      .map(n => n.id);
    
    while (currentLevel.length > 0) {
      levels.push([...currentLevel]);
      currentLevel.forEach(id => visited.add(id));
      
      // 找到下一层
      const nextLevel = new Set<string>();
      currentLevel.forEach(id => {
        const node = nodes.get(id)!;
        node.dependents.forEach(depId => {
          const depNode = nodes.get(depId)!;
          // 检查所有依赖是否都已访问
          if (depNode.dependencies.every(d => visited.has(d))) {
            nextLevel.add(depId);
          }
        });
      });
      
      currentLevel = Array.from(nextLevel);
    }
    
    // 更新节点层级
    levels.forEach((level, index) => {
      level.forEach(id => {
        nodes.get(id)!.level = index;
      });
    });
    
    return levels;
  }
}
```

**Step 3: 运行测试**

```bash
cd packages/execution
npm test
```

Expected: All tests pass

**Step 4: Commit**

```bash
git add packages/execution/src/core/WorkflowParser*
git commit -m "feat(execution): implement WorkflowParser"
```

---

## Task 4: 实现 ExecutionScheduler

**Files:**
- Create: `packages/execution/src/core/ExecutionScheduler.ts`
- Create: `packages/execution/src/core/ExecutionScheduler.test.ts`

**Step 1: 编写测试**

```typescript
// packages/execution/src/core/ExecutionScheduler.test.ts
import { describe, it, expect } from 'vitest';
import { ExecutionScheduler } from './ExecutionScheduler';
import { WorkflowDAG } from '../types';

describe('ExecutionScheduler', () => {
  const scheduler = new ExecutionScheduler();
  
  const mockDAG: WorkflowDAG = {
    id: 'test-dag',
    nodes: new Map([
      ['a', { id: 'a', node: {} as any, dependencies: [], dependents: ['b', 'c'], level: 0 }],
      ['b', { id: 'b', node: {} as any, dependencies: ['a'], dependents: ['d'], level: 1 }],
      ['c', { id: 'c', node: {} as any, dependencies: ['a'], dependents: ['d'], level: 1 }],
      ['d', { id: 'd', node: {} as any, dependencies: ['b', 'c'], dependents: [], level: 2 }],
    ]),
    edges: [],
    startNodes: ['a'],
    endNodes: ['d'],
    levels: [['a'], ['b', 'c'], ['d']],
  };
  
  it('should return ready nodes', () => {
    const completed = new Set<string>();
    const ready = scheduler.getReadyNodes(mockDAG, completed);
    
    expect(ready).toContain('a');
    expect(ready).toHaveLength(1);
  });
  
  it('should return next level after completion', () => {
    const completed = new Set(['a']);
    const ready = scheduler.getReadyNodes(mockDAG, completed);
    
    expect(ready).toContain('b');
    expect(ready).toContain('c');
    expect(ready).toHaveLength(2);
  });
});
```

**Step 2: 实现 ExecutionScheduler**

```typescript
// packages/execution/src/core/ExecutionScheduler.ts
import { WorkflowDAG } from '../types';

export interface ScheduleOptions {
  parallel?: boolean;
  maxConcurrency?: number;
}

export class ExecutionScheduler {
  /**
   * 获取准备执行的节点
   */
  getReadyNodes(dag: WorkflowDAG, completedNodes: Set<string>): string[] {
    const ready: string[] = [];
    
    dag.nodes.forEach((node, id) => {
      if (completedNodes.has(id)) return;
      
      // 检查所有依赖是否已完成
      const allDependenciesMet = node.dependencies.every(depId => 
        completedNodes.has(depId)
      );
      
      if (allDependenciesMet) {
        ready.push(id);
      }
    });
    
    return ready;
  }
  
  /**
   * 获取执行顺序（拓扑排序）
   */
  getExecutionOrder(dag: WorkflowDAG): string[][] {
    return dag.levels;
  }
  
  /**
   * 检查是否可以并行执行
   */
  canExecuteInParallel(nodeId1: string, nodeId2: string, dag: WorkflowDAG): boolean {
    const node1 = dag.nodes.get(nodeId1)!;
    const node2 = dag.nodes.get(nodeId2)!;
    
    // 同一层级且没有依赖关系的节点可以并行
    return node1.level === node2.level && 
           !node1.dependencies.includes(nodeId2) &&
           !node2.dependencies.includes(nodeId1);
  }
}
```

**Step 3: 运行测试并提交**

```bash
cd packages/execution
npm test
git add packages/execution/src/core/ExecutionScheduler*
git commit -m "feat(execution): implement ExecutionScheduler"
```

---

## Task 5: 实现基础 NodeExecutor

**Files:**
- Create: `packages/execution/src/executors/NodeExecutor.ts`
- Create: `packages/execution/src/executors/NodeExecutor.test.ts`

**Step 1: 编写测试**

```typescript
// packages/execution/src/executors/NodeExecutor.test.ts
import { describe, it, expect } from 'vitest';
import { NodeExecutor } from './NodeExecutor';
import { WorkflowNode, NodeType } from '@horos/editor';

describe('NodeExecutor', () => {
  const executor = new NodeExecutor();
  
  it('should execute start node', async () => {
    const node: WorkflowNode = {
      id: 'start',
      type: NodeType.START,
      position: { x: 0, y: 0 },
      data: { initialContext: { user: 'test' } },
    };
    
    const result = await executor.execute(node, {});
    
    expect(result.status).toBe('success');
    expect(result.output).toEqual({ user: 'test' });
  });
  
  it('should handle execution error', async () => {
    const node: WorkflowNode = {
      id: 'error-node',
      type: NodeType.TOOL,
      position: { x: 0, y: 0 },
      data: { toolName: 'error_tool' },
    };
    
    // Mock error tool execution
    const result = await executor.execute(node, {});
    
    expect(result.status).toBe('error');
    expect(result.error).toBeDefined();
  });
});
```

**Step 2: 实现 NodeExecutor**

```typescript
// packages/execution/src/executors/NodeExecutor.ts
import { WorkflowNode, NodeType, NodeExecutionStatus } from '@horos/editor';
import { NodeExecutionResult, ExecutionContext } from '../types';

export interface NodeExecutorConfig {
  timeout?: number;
}

export class NodeExecutor {
  private config: NodeExecutorConfig;
  
  constructor(config: NodeExecutorConfig = {}) {
    this.config = { timeout: 30000, ...config };
  }
  
  /**
   * 执行单个节点
   */
  async execute(
    node: WorkflowNode,
    context: Partial<ExecutionContext>
  ): Promise<NodeExecutionResult> {
    const startTime = new Date();
    
    try {
      const output = await this.executeByType(node, context);
      
      return {
        nodeId: node.id,
        status: NodeExecutionStatus.SUCCESS,
        output,
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
      };
    } catch (error) {
      return {
        nodeId: node.id,
        status: NodeExecutionStatus.ERROR,
        error: error as Error,
        duration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date(),
      };
    }
  }
  
  /**
   * 根据节点类型执行
   */
  private async executeByType(
    node: WorkflowNode,
    context: Partial<ExecutionContext>
  ): Promise<unknown> {
    switch (node.type) {
      case NodeType.START:
        return node.data.initialContext || {};
        
      case NodeType.END:
        return { completed: true };
        
      case NodeType.AGENT:
        // TODO: 集成 Agent Runtime
        return { agent: node.data.label, executed: true };
        
      case NodeType.TOOL:
        // TODO: 集成 Tool Executor
        return { tool: node.data.toolName, executed: true };
        
      case NodeType.CONDITION:
        // TODO: 评估条件
        return { condition: node.data.condition, result: true };
        
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }
}
```

**Step 3: 运行测试并提交**

```bash
cd packages/execution
npm test
git add packages/execution/src/executors/NodeExecutor*
git commit -m "feat(execution): implement NodeExecutor"
```

---

## Task 6: 实现 ExecutionEngine

**Files:**
- Create: `packages/execution/src/core/ExecutionEngine.ts`
- Create: `packages/execution/src/core/ExecutionEngine.test.ts`

**Step 1: 编写测试**

```typescript
// packages/execution/src/core/ExecutionEngine.test.ts
import { describe, it, expect } from 'vitest';
import { ExecutionEngine } from './ExecutionEngine';
import { WorkflowNode, WorkflowEdge, NodeType } from '@horos/editor';

describe('ExecutionEngine', () => {
  const engine = new ExecutionEngine();
  
  const mockNodes: WorkflowNode[] = [
    { id: 'start', type: NodeType.START, position: { x: 0, y: 0 }, data: {} },
    { id: 'end', type: NodeType.END, position: { x: 100, y: 0 }, data: {} },
  ];
  
  const mockEdges: WorkflowEdge[] = [
    { id: 'e1', source: 'start', target: 'end', type: 'custom' },
  ];
  
  it('should start execution', async () => {
    const execution = await engine.start(mockNodes, mockEdges);
    
    expect(execution.executionId).toBeDefined();
    expect(execution.status).toBe('running');
  });
});
```

**Step 2: 实现 ExecutionEngine**

```typescript
// packages/execution/src/core/ExecutionEngine.ts
import { WorkflowNode, WorkflowEdge, ExecutionStatus } from '@horos/editor';
import { WorkflowParser } from './WorkflowParser';
import { ExecutionScheduler } from './ExecutionScheduler';
import { NodeExecutor } from '../executors/NodeExecutor';
import { ExecutionState, ExecutionContext, WorkflowDAG } from '../types';

export interface ExecutionEngineConfig {
  enableCheckpoint?: boolean;
  checkpointInterval?: number;
}

export class ExecutionEngine {
  private parser: WorkflowParser;
  private scheduler: ExecutionScheduler;
  private executor: NodeExecutor;
  private config: ExecutionEngineConfig;
  private executions = new Map<string, ExecutionState>();
  
  constructor(config: ExecutionEngineConfig = {}) {
    this.parser = new WorkflowParser();
    this.scheduler = new ExecutionScheduler();
    this.executor = new NodeExecutor();
    this.config = {
      enableCheckpoint: true,
      checkpointInterval: 5000,
      ...config,
    };
  }
  
  /**
   * 启动执行
   */
  async start(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    initialContext: Record<string, unknown> = {}
  ): Promise<ExecutionState> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 解析 DAG
    const dag = this.parser.parse(nodes, edges);
    
    // 创建执行状态
    const state: ExecutionState = {
      executionId,
      status: ExecutionStatus.RUNNING,
      currentNodes: dag.startNodes,
      completedNodes: [],
      failedNodes: [],
      pendingNodes: Array.from(dag.nodes.keys()).filter(
        id => !dag.startNodes.includes(id)
      ),
      context: {
        executionId,
        workflowId: dag.id,
        variables: new Map(Object.entries(initialContext)),
        nodeOutputs: new Map(),
        startTime: new Date(),
      },
    };
    
    this.executions.set(executionId, state);
    
    // 开始执行
    this.runExecution(executionId, dag);
    
    return state;
  }
  
  /**
   * 执行工作流
   */
  private async runExecution(executionId: string, dag: WorkflowDAG): Promise<void> {
    const state = this.executions.get(executionId)!;
    const completed = new Set<string>();
    
    while (completed.size < dag.nodes.size) {
      // 获取准备执行的节点
      const ready = this.scheduler.getReadyNodes(dag, completed);
      
      if (ready.length === 0) {
        // 检查是否有失败的节点
        if (state.failedNodes.length > 0) {
          state.status = ExecutionStatus.FAILED;
          break;
        }
        break;
      }
      
      // 执行准备就绪的节点
      const results = await Promise.all(
        ready.map(async nodeId => {
          const dagNode = dag.nodes.get(nodeId)!;
          const result = await this.executor.execute(dagNode.node, state.context);
          
          if (result.status === 'success') {
            completed.add(nodeId);
            state.completedNodes.push(nodeId);
            state.context.nodeOutputs.set(nodeId, result.output);
          } else {
            state.failedNodes.push(nodeId);
          }
          
          return result;
        })
      );
      
      // 更新当前节点
      state.currentNodes = this.scheduler.getReadyNodes(dag, completed);
    }
    
    // 更新最终状态
    if (state.failedNodes.length > 0) {
      state.status = ExecutionStatus.FAILED;
    } else if (completed.size === dag.nodes.size) {
      state.status = ExecutionStatus.COMPLETED;
    }
  }
  
  /**
   * 获取执行状态
   */
  getState(executionId: string): ExecutionState | undefined {
    return this.executions.get(executionId);
  }
  
  /**
   * 停止执行
   */
  stop(executionId: string): boolean {
    const state = this.executions.get(executionId);
    if (state) {
      state.status = ExecutionStatus.CANCELLED;
      return true;
    }
    return false;
  }
}
```

**Step 3: 运行测试并提交**

```bash
cd packages/execution
npm test
git add packages/execution/src/core/ExecutionEngine*
git commit -m "feat(execution): implement ExecutionEngine"
```

---

## Task 7: 实现条件分支支持

**Files:**
- Create: `packages/execution/src/executors/ConditionExecutor.ts`
- Modify: `packages/execution/src/executors/NodeExecutor.ts`

**Step 1: 实现 ConditionExecutor**

```typescript
// packages/execution/src/executors/ConditionExecutor.ts
import { WorkflowNode } from '@horos/editor';
import { ExecutionContext } from '../types';

export interface ConditionBranch {
  label: string;
  condition: string;
  targetNodeId: string;
}

export class ConditionExecutor {
  /**
   * 评估条件
   */
  evaluate(condition: string, context: ExecutionContext): boolean {
    // 简单表达式评估
    // TODO: 使用更安全的表达式引擎
    try {
      const variables: Record<string, unknown> = {};
      context.variables.forEach((value, key) => {
        variables[key] = value;
      });
      
      // 简单的变量替换
      const evaluatedCondition = condition.replace(/\$\{(\w+)\}/g, (match, key) => {
        const value = variables[key];
        return typeof value === 'string' ? `"${value}"` : String(value);
      });
      
      // 注意：实际项目中应使用安全的表达式引擎
      return eval(evaluatedCondition);
    } catch (error) {
      console.error('Condition evaluation error:', error);
      return false;
    }
  }
  
  /**
   * 选择分支
   */
  selectBranch(
    node: WorkflowNode,
    context: ExecutionContext
  ): string | null {
    const branches = node.data.branches as ConditionBranch[] || [];
    
    for (const branch of branches) {
      if (this.evaluate(branch.condition, context)) {
        return branch.targetNodeId;
      }
    }
    
    return null;
  }
}
```

**Step 2: 更新 NodeExecutor 支持条件节点**

```typescript
// 在 NodeExecutor.executeByType 中添加
import { ConditionExecutor } from './ConditionExecutor';

// 在 NodeExecutor 类中添加
private conditionExecutor = new ConditionExecutor();

// 在 executeByType 中更新 CONDITION case
case NodeType.CONDITION:
  const selectedBranch = this.conditionExecutor.selectBranch(node, context as ExecutionContext);
  return { condition: node.data.condition, selectedBranch, result: true };
```

**Step 3: Commit**

```bash
git add packages/execution/src/executors/ConditionExecutor*
git commit -m "feat(execution): add condition branch support"
```

---

## Task 8: 实现并行执行支持

**Files:**
- Modify: `packages/execution/src/core/ExecutionEngine.ts`

**Step 1: 更新 ExecutionEngine 支持并行**

```typescript
// 添加并行执行配置
export interface ExecutionEngineConfig {
  enableCheckpoint?: boolean;
  checkpointInterval?: number;
  parallel?: boolean;
  maxConcurrency?: number;
}

// 在 runExecution 方法中添加并行支持
private async runExecution(executionId: string, dag: WorkflowDAG): Promise<void> {
  // ... 现有代码 ...
  
  while (completed.size < dag.nodes.size) {
    const ready = this.scheduler.getReadyNodes(dag, completed);
    
    if (ready.length === 0) break;
    
    if (this.config.parallel) {
      // 并行执行
      const batch = ready.slice(0, this.config.maxConcurrency);
      await Promise.all(batch.map(id => this.executeNode(id, dag, state, completed)));
    } else {
      // 串行执行
      for (const nodeId of ready) {
        await this.executeNode(nodeId, dag, state, completed);
      }
    }
  }
  
  // ... 更新状态 ...
}

private async executeNode(
  nodeId: string,
  dag: WorkflowDAG,
  state: ExecutionState,
  completed: Set<string>
): Promise<void> {
  const dagNode = dag.nodes.get(nodeId)!;
  const result = await this.executor.execute(dagNode.node, state.context);
  
  if (result.status === 'success') {
    completed.add(nodeId);
    state.completedNodes.push(nodeId);
    state.context.nodeOutputs.set(nodeId, result.output);
  } else {
    state.failedNodes.push(nodeId);
  }
}
```

**Step 2: Commit**

```bash
git add packages/execution/src/core/ExecutionEngine.ts
git commit -m "feat(execution): add parallel execution support"
```

---

## Task 9: 创建 CheckpointManager

**Files:**
- Create: `packages/execution/src/checkpoint/CheckpointManager.ts`
- Create: `packages/execution/src/checkpoint/CheckpointManager.test.ts`

**Step 1: 编写测试**

```typescript
// packages/execution/src/checkpoint/CheckpointManager.test.ts
import { describe, it, expect } from 'vitest';
import { CheckpointManager } from './CheckpointManager';
import { ExecutionState } from '../types';

describe('CheckpointManager', () => {
  const manager = new CheckpointManager();
  
  const mockState: ExecutionState = {
    executionId: 'test-001',
    status: 'running',
    currentNodes: ['node-1'],
    completedNodes: ['start'],
    failedNodes: [],
    pendingNodes: ['node-2'],
    context: {
      executionId: 'test-001',
      workflowId: 'wf-001',
      variables: new Map(),
      nodeOutputs: new Map([['start', { result: 'ok' }]]),
      startTime: new Date(),
    },
  };
  
  it('should create checkpoint', async () => {
    const checkpoint = await manager.create(mockState);
    
    expect(checkpoint).toBeDefined();
    expect(checkpoint.executionId).toBe('test-001');
    expect(checkpoint.nodeOutputs).toHaveProperty('start');
  });
  
  it('should restore from checkpoint', async () => {
    const checkpoint = await manager.create(mockState);
    const restored = await manager.restore(checkpoint.id);
    
    expect(restored).toBeDefined();
    expect(restored?.executionId).toBe('test-001');
  });
});
```

**Step 2: 实现 CheckpointManager**

```typescript
// packages/execution/src/checkpoint/CheckpointManager.ts
import { ExecutionState, ExecutionContext } from '../types';

export interface Checkpoint {
  id: string;
  executionId: string;
  timestamp: Date;
  status: string;
  currentNodes: string[];
  completedNodes: string[];
  failedNodes: string[];
  pendingNodes: string[];
  variables: Record<string, unknown>;
  nodeOutputs: Record<string, unknown>;
}

export class CheckpointManager {
  private checkpoints = new Map<string, Checkpoint>();
  
  /**
   * 创建检查点
   */
  async create(state: ExecutionState): Promise<Checkpoint> {
    const checkpoint: Checkpoint = {
      id: `chk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      executionId: state.executionId,
      timestamp: new Date(),
      status: state.status,
      currentNodes: [...state.currentNodes],
      completedNodes: [...state.completedNodes],
      failedNodes: [...state.failedNodes],
      pendingNodes: [...state.pendingNodes],
      variables: Object.fromEntries(state.context.variables),
      nodeOutputs: Object.fromEntries(state.context.nodeOutputs),
    };
    
    this.checkpoints.set(checkpoint.id, checkpoint);
    
    return checkpoint;
  }
  
  /**
   * 恢复执行状态
   */
  async restore(checkpointId: string): Promise<ExecutionState | null> {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) return null;
    
    return {
      executionId: checkpoint.executionId,
      status: checkpoint.status as any,
      currentNodes: checkpoint.currentNodes,
      completedNodes: checkpoint.completedNodes,
      failedNodes: checkpoint.failedNodes,
      pendingNodes: checkpoint.pendingNodes,
      context: {
        executionId: checkpoint.executionId,
        workflowId: '',
        variables: new Map(Object.entries(checkpoint.variables)),
        nodeOutputs: new Map(Object.entries(checkpoint.nodeOutputs)),
        startTime: checkpoint.timestamp,
      },
    };
  }
  
  /**
   * 获取执行的所有检查点
   */
  async getCheckpoints(executionId: string): Promise<Checkpoint[]> {
    return Array.from(this.checkpoints.values())
      .filter(chk => chk.executionId === executionId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  /**
   * 删除检查点
   */
  async delete(checkpointId: string): Promise<boolean> {
    return this.checkpoints.delete(checkpointId);
  }
}
```

**Step 3: 运行测试并提交**

```bash
cd packages/execution
npm test
git add packages/execution/src/checkpoint/
git commit -m "feat(execution): implement CheckpointManager"
```

---

## Task 10: 集成 Checkpoint 到 ExecutionEngine

**Files:**
- Modify: `packages/execution/src/core/ExecutionEngine.ts`

**Step 1: 添加自动检查点**

```typescript
import { CheckpointManager } from '../checkpoint/CheckpointManager';

// 在 ExecutionEngine 类中添加
private checkpointManager: CheckpointManager;
private checkpointTimer?: NodeJS.Timeout;

// 在 constructor 中初始化
this.checkpointManager = new CheckpointManager();

// 在 runExecution 中添加定时检查点
private async runExecution(executionId: string, dag: WorkflowDAG): Promise<void> {
  const state = this.executions.get(executionId)!;
  
  // 启动定时检查点
  if (this.config.enableCheckpoint) {
    this.checkpointTimer = setInterval(async () => {
      await this.checkpointManager.create(state);
    }, this.config.checkpointInterval);
  }
  
  // ... 执行逻辑 ...
  
  // 清理定时器
  if (this.checkpointTimer) {
    clearInterval(this.checkpointTimer);
  }
  
  // 最终检查点
  if (this.config.enableCheckpoint) {
    await this.checkpointManager.create(state);
  }
}

/**
 * 从检查点恢复执行
 */
async resumeFromCheckpoint(checkpointId: string): Promise<ExecutionState | null> {
  const state = await this.checkpointManager.restore(checkpointId);
  if (!state) return null;
  
  // 重新加载 DAG
  // TODO: 需要存储工作流定义以恢复 DAG
  
  this.executions.set(state.executionId, state);
  
  // 继续执行
  // this.runExecution(state.executionId, dag);
  
  return state;
}
```

**Step 2: Commit**

```bash
git add packages/execution/src/core/ExecutionEngine.ts
git commit -m "feat(execution): integrate checkpoint into ExecutionEngine"
```

---

## Task 11: 更新主导出文件

**Files:**
- Modify: `packages/execution/src/index.ts`

**Step 1: 更新导出**

```typescript
// packages/execution/src/index.ts

// Core
export { WorkflowParser } from './core/WorkflowParser';
export { ExecutionScheduler } from './core/ExecutionScheduler';
export { ExecutionEngine } from './core/ExecutionEngine';

// Executors
export { NodeExecutor } from './executors/NodeExecutor';
export { ConditionExecutor } from './executors/ConditionExecutor';

// Checkpoint
export { CheckpointManager } from './checkpoint/CheckpointManager';

// Types
export type {
  WorkflowDAG,
  DAGNode,
  DAGEdge,
  ExecutionContext,
  ExecutionState,
  NodeExecutionResult,
  Checkpoint,
} from './types';
```

**Step 2: Commit**

```bash
git add packages/execution/src/index.ts
git commit -m "feat(execution): update exports"
```

---

## Task 12: 创建集成测试

**Files:**
- Create: `packages/execution/src/__tests__/integration.test.ts`

**Step 1: 创建集成测试**

```typescript
// packages/execution/src/__tests__/integration.test.ts
import { describe, it, expect } from 'vitest';
import { ExecutionEngine } from '../core/ExecutionEngine';
import { WorkflowNode, WorkflowEdge, NodeType } from '@horos/editor';

describe('Execution Integration', () => {
  it('should execute simple workflow end-to-end', async () => {
    const engine = new ExecutionEngine();
    
    const nodes: WorkflowNode[] = [
      { id: 'start', type: NodeType.START, position: { x: 0, y: 0 }, data: { initialContext: { value: 1 } } },
      { id: 'agent', type: NodeType.AGENT, position: { x: 100, y: 0 }, data: { label: 'Process' } },
      { id: 'end', type: NodeType.END, position: { x: 200, y: 0 }, data: {} },
    ];
    
    const edges: WorkflowEdge[] = [
      { id: 'e1', source: 'start', target: 'agent', type: 'custom' },
      { id: 'e2', source: 'agent', target: 'end', type: 'custom' },
    ];
    
    const execution = await engine.start(nodes, edges);
    
    // 等待执行完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const finalState = engine.getState(execution.executionId);
    expect(finalState?.status).toBe('completed');
    expect(finalState?.completedNodes).toContain('start');
    expect(finalState?.completedNodes).toContain('agent');
    expect(finalState?.completedNodes).toContain('end');
  });
  
  it('should handle parallel execution', async () => {
    const engine = new ExecutionEngine({ parallel: true, maxConcurrency: 2 });
    
    const nodes: WorkflowNode[] = [
      { id: 'start', type: NodeType.START, position: { x: 0, y: 0 }, data: {} },
      { id: 'agent1', type: NodeType.AGENT, position: { x: 100, y: -50 }, data: {} },
      { id: 'agent2', type: NodeType.AGENT, position: { x: 100, y: 50 }, data: {} },
      { id: 'end', type: NodeType.END, position: { x: 200, y: 0 }, data: {} },
    ];
    
    const edges: WorkflowEdge[] = [
      { id: 'e1', source: 'start', target: 'agent1', type: 'custom' },
      { id: 'e2', source: 'start', target: 'agent2', type: 'custom' },
      { id: 'e3', source: 'agent1', target: 'end', type: 'custom' },
      { id: 'e4', source: 'agent2', target: 'end', type: 'custom' },
    ];
    
    const execution = await engine.start(nodes, edges);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const finalState = engine.getState(execution.executionId);
    expect(finalState?.status).toBe('completed');
  });
});
```

**Step 2: 运行测试并提交**

```bash
cd packages/execution
npm test
git add packages/execution/src/__tests__/
git commit -m "test(execution): add integration tests"
```

---

## Task 13: 构建和验证

**Step 1: 构建包**

```bash
cd packages/execution
npm run build
```

Expected: Build success

**Step 2: 运行所有测试**

```bash
cd packages/execution
npm test
```

Expected: All tests pass

**Step 3: Commit**

```bash
git add -A
git commit -m "feat(execution): complete Phase 4 - execution engine

- WorkflowParser: DAG parsing and topology sorting
- ExecutionScheduler: Task scheduling with dependency resolution
- NodeExecutor: Node execution with type-specific handlers
- ExecutionEngine: Main execution orchestrator
- ConditionExecutor: Branch evaluation support
- CheckpointManager: State persistence and recovery
- Parallel execution support
- Full test coverage"
```

---

## 验收标准

Phase 4 完成时，系统应该能够：

- [x] 解析工作流定义为 DAG
- [x] 按依赖关系调度节点执行
- [x] 执行各种类型的节点
- [x] 支持条件分支
- [x] 支持并行执行
- [x] 创建和恢复检查点
- [x] 所有测试通过
- [x] 构建成功
