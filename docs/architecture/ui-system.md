# UI 系统设计

> 企业级 SaaS 控制台，风格：Notion × Palantir 数据分析控制台。
> 对应代码：`src/app`、`src/components`。前端遵循 `.cursor/rules/frontend.mdc`。

## 1. 布局

```text
┌──────────────────────────────┐
│ Top Bar                      │
├──────────┬───────────────────┤
│ Sidebar  │ Main Workspace    │
│          │                   │
│ Jobs     │ Workflow Graph    │
│ Reports  │ Risk Panel        │
│ RAG      │ Report Viewer     │
└──────────┴───────────────────┘
```

## 2. 视觉风格

- Enterprise SaaS
- Notion × Palantir 风格
- 数据分析控制台

## 3. 色彩系统

| 类型 | 颜色 |
| --- | --- |
| Primary | `#111827` |
| Success | `#22c55e` |
| Warning | `#f59e0b` |
| High Risk | `#ef4444` |
| Background | `#f8fafc` |

## 4. 核心 UI 模块

### 1) Workflow Tracker
- 审计流程可视化（对应 LangGraph 节点）
- 实时状态更新

### 2) Risk Cards
```text
🚨 High Risk
Duplicate Payment
Evidence: invoice_id match
Severity: HIGH
```
按 severity 着色（high=红 / medium=橙 / low=绿）。

### 3) Audit Report Viewer
- Notion 风格文档
- 可折叠结构
- 风险高亮

### 4) Explainability Panel
- rule 触发原因
- 数据证据
- 审计标准引用

## 5. 组件约定

- 基于 shadcn/ui + TailwindCSS。
- 优先 React Server Components；仅在需要交互时使用 `"use client"`。
- UI 只消费 BFF 返回的标准结构（如 `AuditFinding`），不在组件内做业务推理。
- 设计质量参考 design-taste-frontend skill，避免模板化外观。
