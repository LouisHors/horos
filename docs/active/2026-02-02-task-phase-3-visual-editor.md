# 任务追踪: Phase 3 - 可视化编辑器开发

**任务ID**: TASK-2026-02-02-003  
**创建时间**: 2026-02-02  
**预计用时**: 14天  
**依赖**: Phase 2 完成 ✅  
**状态**: 🟡 进行中

---

## 任务描述

实现可视化工作流编辑器，基于 ReactFlow 构建拖拽式画布，支持节点库、属性面板、撤销重做等核心编辑功能。

## 相关文档

- **计划文档**: [../plans/2026-01-30-phase-3-visual-editor.md](../plans/2026-01-30-phase-3-visual-editor.md)
- **设计文档**: [../../frontend_design.md](../../frontend_design.md)

---

## 项目结构

```
packages/
├── core/                       # Phase 1 已存在
├── runtime/                    # Phase 2 已存在
└── editor/                     # Phase 3 新建
    ├── src/
    │   ├── components/
    │   │   ├── canvas/
    │   │   │   ├── FlowCanvas.tsx         # 🟡 Task 1 - ReactFlow画布
    │   │   │   ├── CustomNode.tsx         # 🟡 Task 2 - 自定义节点
    │   │   │   ├── CustomEdge.tsx         # 🟡 Task 3 - 自定义连线
    │   │   │   ├── MiniMapControl.tsx     # 🟡 Task 4 - 画布控件
    │   │   │   └── Background.tsx         # 🟡 Task 4 - 背景组件
    │   │   ├── nodes/
    │   │   │   ├── AgentNode.tsx          # 🟡 Task 5 - Agent节点
    │   │   │   ├── ToolNode.tsx           # 🟡 Task 5 - 工具节点
    │   │   │   ├── ConditionNode.tsx      # 🟡 Task 5 - 条件节点
    │   │   │   ├── StartNode.tsx          # 🟡 Task 5 - 开始节点
    │   │   │   ├── EndNode.tsx            # 🟡 Task 5 - 结束节点
    │   │   │   └── index.ts
    │   │   ├── panels/
    │   │   │   ├── NodeLibrary.tsx        # 🟡 Task 6 - 节点库面板
    │   │   │   ├── PropertyPanel.tsx      # 🟡 Task 7 - 属性面板
    │   │   │   ├── Toolbar.tsx            # 🟡 Task 8 - 工具栏
    │   │   │   └── ExecutionPanel.tsx     # 🔵 Task 17 - 执行面板
    │   │   └── forms/
    │   │       ├── DynamicForm.tsx        # 🟡 Task 9 - 动态表单
    │   │       ├── CodeEditor.tsx         # 🟡 Task 10 - 代码编辑器
    │   │       └── SchemaRenderer.tsx     # 🟡 Task 11 - Schema渲染器
    │   ├── hooks/
    │   │   ├── useFlowState.ts            # 🟡 Task 12 - Flow状态Hook
    │   │   ├── useHistory.ts              # 🟡 Task 13 - 撤销重做Hook
    │   │   ├── useClipboard.ts            # 🟡 Task 14 - 复制粘贴Hook
    │   │   ├── useKeyboard.ts             # 🟡 Task 15 - 快捷键Hook
    │   │   └── useNodeRegistry.ts         # 🟡 Task 6 - 节点注册Hook
    │   ├── stores/
    │   │   ├── flowStore.ts               # 🟡 Task 12 - Flow状态管理
    │   │   ├── uiStore.ts                 # 🟡 Task 16 - UI状态管理
    │   │   └── index.ts
    │   ├── core/
    │   │   ├── NodeRegistry.ts            # 🟡 Task 6 - 节点注册表
    │   │   ├── HistoryManager.ts          # 🟡 Task 13 - 历史管理器
    │   │   ├── ClipboardManager.ts        # 🟡 Task 14 - 剪贴板管理器
    │   │   └── index.ts
    │   ├── types/
    │   │   ├── node.ts                    # 🟡 Task 6 - 节点类型定义
    │   │   ├── flow.ts                    # 🟡 Task 6 - 流程类型定义
    │   │   └── index.ts
    │   ├── utils/
    │   │   ├── layout.ts                  # 🟡 Task 18 - 自动布局
    │   │   ├── validation.ts              # 🟡 Task 18 - 流程验证
    │   │   ├── export.ts                  # 🟡 Task 18 - 导入导出
    │   │   └── shortcuts.ts               # 🟡 Task 15 - 快捷键配置
    │   ├── styles/
    │   │   ├── nodes.css
    │   │   ├── canvas.css
    │   │   └── index.css
    │   └── index.ts                       # 导出
    ├── examples/
    │   ├── basic-flow.tsx                 # 🟡 Task 19 - 基础示例
    │   └── complex-workflow.tsx           # 🟡 Task 19 - 复杂示例
    ├── package.json
    └── tsconfig.json
```

---

## 实施计划

### Week 5 - Day 1-3: ReactFlow 基础 (Tasks 1-5) 🟡

- [ ] **Task 1**: 集成 ReactFlow 画布
  - 文件: `packages/editor/src/components/canvas/FlowCanvas.tsx`
  - ReactFlow 组件集成
  - 基础画布配置
  - 拖拽交互

- [x] **Task 2**: 实现自定义节点组件
  - 文件: `packages/editor/src/components/canvas/CustomNode.tsx`
  - 节点选中/悬停状态
  - 连接点 (Handle)
  - 节点样式

- [x] **Task 3**: 实现自定义连线
  - 文件: `packages/editor/src/components/canvas/CustomEdge.tsx`
  - 连线动画
  - 连线标签
  - 连线样式

- [x] **Task 4**: 画布控件
  - 文件: `packages/editor/src/components/canvas/MiniMapControl.tsx`
  - MiniMap 小地图
  - Controls 缩放控件
  - 背景网格

- [x] **Task 5**: 实现各类节点组件
  - 文件: `packages/editor/src/components/nodes/*.tsx`
  - AgentNode - Agent节点
  - ToolNode - 工具节点
  - ConditionNode - 条件分支节点
  - StartNode - 开始节点
  - EndNode - 结束节点

### Week 5 - Day 4-5: 节点系统 (Tasks 6-8) 🟡

- [x] **Task 6**: 节点注册表系统
  - 文件: `packages/editor/src/core/NodeRegistry.ts`
  - 文件: `packages/editor/src/hooks/useNodeRegistry.ts`
  - 动态节点注册
  - 节点分类和搜索
  - 节点库面板 `NodeLibrary.tsx`

- [x] **Task 7**: 属性面板
  - 文件: `packages/editor/src/components/panels/PropertyPanel.tsx`
  - 选中节点属性编辑
  - 表单验证
  - 实时预览

- [x] **Task 8**: 工具栏 (Day 23)
  - 文件: `packages/editor/src/components/panels/Toolbar.tsx`
  - 画布控制按钮
  - 执行控制
  - 视图切换

### Week 5 - Day 6-7: 动态表单与编辑器 (Tasks 9-11) 🟡

- [x] **Task 9**: 动态表单渲染
  - 文件: `packages/editor/src/components/forms/DynamicForm.tsx`
  - 基于 JSON Schema 生成表单
  - 表单字段联动
  - 表单验证

- [x] **Task 10**: 代码编辑器集成 (Day 23)
  - 文件: `packages/editor/src/components/forms/CodeEditor.tsx`
  - Monaco Editor / CodeMirror 集成
  - 提示词编辑
  - 代码高亮

- [x] **Task 11**: JSON Schema 驱动配置
  - 文件: `packages/editor/src/components/forms/SchemaRenderer.tsx`
  - Schema 解析和渲染
  - 复杂类型支持
  - 自定义渲染器

### Week 6 - Day 1-3: 编辑器高级功能 (Tasks 12-15) 🟡

- [x] **Task 12**: Flow 状态管理
  - 文件: `packages/editor/src/stores/flowStore.ts`
  - 文件: `packages/editor/src/hooks/useFlowState.ts`
  - Zustand Store 实现
  - 节点/边状态管理
  - 选中状态同步

- [ ] **Task 13**: 撤销重做功能
  - 文件: `packages/editor/src/core/HistoryManager.ts`
  - 文件: `packages/editor/src/hooks/useHistory.ts`
  - 历史记录管理
  - 撤销/重做操作
  - 历史限制

- [ ] **Task 14**: 复制粘贴功能
  - 文件: `packages/editor/src/core/ClipboardManager.ts`
  - 文件: `packages/editor/src/hooks/useClipboard.ts`
  - 节点复制
  - 跨画布粘贴
  - 剪贴板序列化

- [ ] **Task 15**: 快捷键支持
  - 文件: `packages/editor/src/hooks/useKeyboard.ts`
  - 文件: `packages/editor/src/utils/shortcuts.ts`
  - 键盘事件监听
  - 快捷键绑定
  - 右键菜单

### Week 6 - Day 4-5: 状态管理与集成 (Tasks 16-19) 🟡

- [ ] **Task 16**: UI 状态管理
  - 文件: `packages/editor/src/stores/uiStore.ts`
  - 面板显隐状态
  - 主题切换
  - 布局状态

- [ ] **Task 17**: 执行状态同步
  - 文件: `packages/editor/src/components/panels/ExecutionPanel.tsx`
  - 执行状态显示
  - 实时日志
  - 执行控制

- [ ] **Task 18**: 辅助功能
  - 文件: `packages/editor/src/utils/layout.ts` - 自动布局
  - 文件: `packages/editor/src/utils/validation.ts` - 流程验证
  - 文件: `packages/editor/src/utils/export.ts` - 导入导出
  - DAG 布局算法
  - 循环检测
  - JSON/YAML 导入导出

- [ ] **Task 19**: 示例和文档
  - 文件: `packages/editor/examples/basic-flow.tsx`
  - 文件: `packages/editor/examples/complex-workflow.tsx`
  - 基础示例
  - 复杂工作流示例

---

## 核心设计

### 节点数据流

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  NodeLibrary │────►│  FlowCanvas  │◄────│ PropertyPanel│
│  (拖拽创建)   │     │  (画布编辑)   │     │  (属性编辑)   │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                   ┌────────┴────────┐
                   │   flowStore     │
                   │  (Zustand)      │
                   └────────┬────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
       ┌──────────┐  ┌──────────┐  ┌──────────┐
       │  Nodes   │  │   Edges  │  │ Selection│
       └──────────┘  └──────────┘  └──────────┘
```

### 历史管理

```
Action ──► HistoryManager ──► State Snapshot
                              
Undo:  currentIndex-- ──► restore snapshot
Redo:  currentIndex++ ──► restore snapshot
```

### 快捷键映射

| 快捷键 | 功能 |
|--------|------|
| `Ctrl/Cmd + Z` | 撤销 |
| `Ctrl/Cmd + Shift + Z` | 重做 |
| `Ctrl/Cmd + C` | 复制节点 |
| `Ctrl/Cmd + V` | 粘贴节点 |
| `Ctrl/Cmd + S` | 保存工作流 |
| `Delete` | 删除选中 |
| `Ctrl/Cmd + A` | 全选 |
| `Space` | 按住拖拽画布 |

---

## 验收标准

Phase 3 完成时，系统应该能够：

- [ ] 可拖拽创建各类节点
- [ ] 可拖拽连接节点
- [ ] 可配置节点属性
- [ ] 支持撤销重做操作
- [ ] 支持复制粘贴节点
- [ ] 支持键盘快捷键
- [ ] 可保存/加载工作流
- [ ] 支持导入/导出 JSON/YAML
- [ ] 画布渲染性能良好 (100节点 < 100ms)

---

## 依赖检查

### 前置条件

- [x] Phase 2 Agent Runtime 完成
- [x] React 18+ 环境
- [x] TypeScript 配置
- [x] Tailwind CSS 配置

### 新增依赖

```json
{
  "dependencies": {
    "@xyflow/react": "^12.x",
    "reactflow": "^12.x",
    "zustand": "^4.x",
    "immer": "^10.x",
    "@monaco-editor/react": "^4.x",
    "monaco-editor": "^0.x",
    "dagre": "^0.x",
    "elkjs": "^0.x",
    "js-yaml": "^4.x",
    "react-hotkeys-hook": "^4.x"
  }
}
```

---

## 阻塞问题

无

---

## 进展记录

### 2026-02-02 - Day 21

- **状态**: ✅ Day 21 完成
- **完成任务**:
  - ✅ 创建 packages/editor 模块
  - ✅ 配置 package.json 和 tsconfig.json
  - ✅ 安装 ReactFlow 及相关依赖 (@xyflow/react, dagre, elkjs, zustand, etc.)
  - ✅ 实现 FlowCanvas 基础组件
  - ✅ 实现 5 种节点组件 (StartNode, EndNode, AgentNode, ToolNode, ConditionNode)
  - ✅ 实现 CustomEdge 自定义连线
  - ✅ 实现 FlowStore (Zustand + Immer)
  - ✅ 实现 UIStore
  - ✅ 实现 NodeRegistry 节点注册表
  - ✅ 构建成功 (ESM + DTS)
  - ✅ 编写 TDD 测试 (53 个测试全部通过)
    - 类型定义测试
    - Store 单元测试
    - NodeRegistry 单元测试
    - 工具函数测试
    - 集成测试
- **Git 提交**:
  - feat: add @horos/editor package with ReactFlow canvas
  - test: add TDD tests for editor (53 tests passing)
- **备注**: 
  - Day 21 全部 5 个 Task 已完成
  - 编辑器基础架构已就绪
  - TDD 测试已添加，共 53 个测试全部通过

### 2026-02-02 - Day 22

- **状态**: ✅ Day 22 完成
- **完成任务**:
  - ✅ 实现 useNodeRegistry Hook
  - ✅ 实现 NodeLibrary 面板组件
    - 节点列表显示
    - 分类筛选
    - 搜索功能
    - 拖拽创建
  - ✅ 实现 PropertyPanel 属性面板
    - 选中节点属性编辑
    - 动态表单渲染
    - 各节点类型配置字段
  - ✅ 实现 DynamicForm 动态表单组件
    - 支持 text, textarea, number, select, code, json 字段类型
  - ✅ 创建 with-panels 示例
  - ✅ 更新测试 (59 个测试全部通过)
- **Git 提交**:
  - feat: add NodeLibrary and PropertyPanel components
  - feat: add DynamicForm with multiple field types
  - test: add tests for hooks and forms
- **构建状态**:
  - ESM: 46.51 KB
  - DTS: 9.30 KB
  - Tests: 59 passed
- **备注**: 
  - Day 22 全部 Task 已完成
  - 可开始 Day 23 工具栏和撤销重做功能

### 2026-02-05 - Day 23-24

- **状态**: ✅ Day 23-24 完成
- **完成任务**:
  - ✅ Task 8: 实现 Toolbar 工具栏组件
    - 文件操作按钮 (保存/打开/导入/导出)
    - 执行控制按钮 (运行/停止)
    - 编辑操作 (撤销/重做/复制/粘贴/删除)
    - 视图控制 (缩放/适配/网格切换)
    - 面板切换按钮
  - ✅ Task 10: 实现 CodeEditor 代码编辑器组件
    - Monaco Editor 集成 (@monaco-editor/react)
    - PromptEditor 专门用于提示词编辑
    - JsonEditor 支持 JSON 验证
    - ScriptEditor 支持多种语言
    - 变量高亮支持
  - ✅ Task 12: 实现 useFlowState Hook
    - 基于 flowStore 的封装
    - 节点操作 (添加/更新/删除/查询)
    - 边操作 (添加/删除/查询连接关系)
    - 选择操作 (单选/多选/清除)
    - 批量操作 (复制/删除选中)
    - 序列化 (导入/导出)
  - ✅ 更新组件导出
  - ✅ 更新测试 (72 个测试全部通过)
- **Git 提交**:
  - feat: add Toolbar component with full controls
  - feat: add CodeEditor with Monaco integration
  - feat: add useFlowState hook for flow management
  - test: add tests for useFlowState
- **构建状态**:
  - ESM: 65.80 KB
  - DTS: 14.21 KB
  - Tests: 72 passed
- **备注**: 
  - Task 8, 10, 12 已完成
  - 可开始 Task 13-16 (撤销重做、复制粘贴、快捷键、UI状态)

---

*Phase 3 进行中 - 2026-02-05*
