# Phase 5: 编辑器与执行引擎集成

## 目标
将 @horos/editor 与 @horos/execution 集成，实现从画布直接运行工作流。

## 架构设计

```
┌─────────────────────────────────────────────────────────────────┐
│                      @horos/editor                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   FlowCanvas │───▶│ExecutionBridge│───▶│   Execution  │      │
│  │   (ReactFlow)│◀───│  (集成层)     │◀───│   Engine     │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  Node Status │    │  Execution   │    │  Execution   │      │
│  │  (Visual)    │    │   Toolbar    │    │   Panel      │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

## 任务清单

### Task 1: 添加执行引擎依赖
- [ ] 在 editor/package.json 添加 @horos/execution 依赖
- [ ] 更新 pnpm-workspace.yaml（如需要）

### Task 2: 创建 ExecutionBridge
- [ ] 创建 `integrations/ExecutionBridge.ts`
- [ ] 转换 ReactFlow nodes/edges 到 DAG
- [ ] 处理执行事件映射到 UI 状态

### Task 3: 扩展 NodeExecutor 注册
- [ ] 创建 `executors/AgentNodeExecutor.ts`
- [ ] 创建 `executors/ToolNodeExecutor.ts`
- [ ] 创建 `executors/StartNodeExecutor.ts`
- [ ] 创建 `executors/EndNodeExecutor.ts`

### Task 4: 创建 useExecution Hook
- [ ] 创建 `hooks/useExecution.ts`
- [ ] 管理执行状态（idle/running/paused/completed/failed）
- [ ] 提供 start/pause/resume/stop 方法

### Task 5: 创建 ExecutionToolbar 组件
- [ ] 播放/暂停/停止按钮
- [ ] 执行状态显示
- [ ] 集成到现有 Toolbar

### Task 6: 节点状态可视化
- [ ] 扩展 NodeWrapper 显示状态边框
- [ ] 添加运行中动画 (spinner)
- [ ] 成功/失败图标显示

### Task 7: 更新 ExecutionPanel
- [ ] 显示执行日志
- [ ] 节点执行时间
- [ ] 错误信息展示

### Task 8: 集成测试
- [ ] 测试简单工作流执行
- [ ] 测试并行节点执行
- [ ] 测试条件分支执行

## 集成示例

```typescript
// 在编辑器中运行工作流
const { start, status } = useExecution();

const handleRun = () => {
  const result = await start(nodes, edges);
  console.log('执行结果:', result);
};
```

## 验收标准
- [ ] 可以从画布启动工作流执行
- [ ] 节点状态实时更新（运行中/成功/失败）
- [ ] 执行日志在面板中显示
- [ ] 支持暂停/恢复/停止执行
- [ ] 所有测试通过
