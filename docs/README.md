# Horos 文档中心

> 项目文档统一管理系统

---

## 目录结构

```
docs/
├── README.md                 # 本文档 - 导航索引
├── active/                   # 活跃状态追踪文档
│   ├── 2026-01-30-task-phase-1-foundation.md
│   ├── 2026-01-30-task-phase-2-agent-runtime.md
│   ├── 2026-02-02-task-phase-3-visual-editor.md
│   └── 2026-02-06-task-phase-4-execution-engine.md
├── plans/                    # 静态计划文档
│   ├── 2026-01-30-phase-1-foundation.md
│   ├── 2026-01-30-phase-2-agent-runtime.md
│   ├── 2026-02-06-phase-4-execution-engine.md
│   ├── 2026-02-06-phase-5-integration.md
│   ├── 2026-02-06-phase-6-real-executors.md
│   └── 2026-02-06-phase-7-10-complete.md
├── archive/                  # 已归档文档
├── reference/                # 参考资料
│   ├── FEATURES.md
│   └── MULTI_LLM_SETUP.md
├── v1/                       # V1 版本文档 (预留)
└── v2/                       # V2 版本架构文档
    ├── SYSTEM_OVERVIEW_V2.md       # 系统总览
    ├── ARCHITECTURE_V2.md          # 架构概述
    ├── master_agent_design.md      # Master Agent 设计
    ├── agent_runtime_design.md     # Agent 运行时设计
    ├── frontend_v2_design.md       # 前端设计
    ├── data_model_v2_design.md     # 数据模型设计
    └── api_design_v2.md            # API 设计
```

---

## 快速导航

### V2 架构文档 (当前)

| 文档 | 描述 | 状态 |
|------|------|------|
| [SYSTEM_OVERVIEW_V2.md](./v2/SYSTEM_OVERVIEW_V2.md) | V2 系统总览 - 10大核心模块 | ✅ 完成 |
| [ARCHITECTURE_V2.md](./v2/ARCHITECTURE_V2.md) | V2 架构概述 | ✅ 完成 |
| [master_agent_design.md](./v2/master_agent_design.md) | Master Agent 核心类设计 | ✅ 完成 |
| [agent_runtime_design.md](./v2/agent_runtime_design.md) | Agent 运行时架构 | ✅ 完成 |
| [frontend_v2_design.md](./v2/frontend_v2_design.md) | 三面板 UI 设计 | ✅ 完成 |
| [data_model_v2_design.md](./v2/data_model_v2_design.md) | 数据模型设计 | ✅ 完成 |
| [api_design_v2.md](./v2/api_design_v2.md) | API 接口设计 | ✅ 完成 |

### 实施计划

| 阶段 | 文档 | 状态 |
|------|------|------|
| Phase 1 | [基础架构搭建](./plans/2026-01-30-phase-1-foundation.md) | ✅ 已完成 |
| Phase 2 | [Agent 运行时](./plans/2026-01-30-phase-2-agent-runtime.md) | ✅ 已完成 |
| Phase 3 | [可视化编辑器](./plans/2026-02-02-task-phase-3-visual-editor.md) | ✅ 已完成 |
| Phase 4 | [执行引擎](./plans/2026-02-06-phase-4-execution-engine.md) | 🔄 进行中 |
| Phase 5 | [系统集成](./plans/2026-02-06-phase-5-integration.md) | ⏳ 待开始 |
| Phase 6 | [真实执行器](./plans/2026-02-06-phase-6-real-executors.md) | ⏳ 待开始 |
| Phase 7-10 | [完善与扩展](./plans/2026-02-06-phase-7-10-complete.md) | ⏳ 待开始 |

### 活跃任务

- [Phase 1 实施任务](./active/2026-01-30-task-phase-1-foundation.md)
- [Phase 2 实施任务](./active/2026-01-30-task-phase-2-agent-runtime.md)
- [Phase 3 实施任务](./active/2026-02-02-task-phase-3-visual-editor.md)
- [Phase 4 实施任务](./active/2026-02-06-task-phase-4-execution-engine.md)

---

## 文档统计

- **总文档数**: 19
- **架构设计**: 7 (v2/)
- **实施计划**: 6 (plans/)
- **活跃任务**: 4 (active/)
- **参考资料**: 2 (reference/)
- **已归档**: 0

---

## 使用指南

### 查找文档

按关键词搜索：
```bash
# 搜索所有文档中的关键词
grep -r "关键词" docs/ --include="*.md"
```

### 文档分类规则

| 目录 | 用途 | 示例 |
|------|------|------|
| `active/` | 当前正在进行的任务、Bug、决策 | 任务追踪文档 |
| `plans/` | 长期计划、设计方案、架构文档 | 阶段计划、设计文档 |
| `archive/` | 已完成的文档归档 | 已关闭的任务 |
| `reference/` | 参考资料、配置指南 | 功能清单、配置说明 |
| `v1/`, `v2/` | 版本特定的架构文档 | 系统设计文档 |

---

*最后更新: 2026-02-06*
