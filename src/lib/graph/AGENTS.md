# AGENTS.md — src/lib/graph（LangGraph 审计流程编排）

## 职责
用 LangGraph 编排端到端审计工作流，串联 LLM / RAG / Rule Engine / 导出。

## 节点顺序
```text
parseData → auditPlanner(LLM+RAG) → ruleEngine(deterministic)
→ anomalyDetection → riskAssessment → workpaperGeneration → reportExport
```

## 职责分离（不得越界）
- `auditPlanner` / `workpaperGeneration`：调用 `lib/llm`（+ `lib/rag` 增强）。
- `ruleEngine`：调用 `lib/rules` 纯函数，确定性检测。
- `reportExport`：调用 `lib/export` + 写 `audit_reports`。

## 规则
- 节点间通过共享 state 传递数据；调整流程**只改图定义**，不要把流程顺序散落到 api/业务代码。
- 每个节点输出可序列化、可解释（汇聚成 `AuditFinding[]` 与底稿）。
- 长流程注意状态持久化与任务 `status` 更新（`audit_jobs.status`）。

## 相关
- 设计：`docs/architecture/ai-system.md` §4、`ARCHITECTURE.md` §4 数据流
