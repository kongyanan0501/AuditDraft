# AGENTS.md — src/lib/export（底稿/报告导出）

## 职责
把审计结果导出为标准审计底稿（Word / PDF）与报告。

## 规则
- 输入：结构化报告（含 `AuditFinding[]` 与底稿文本），输出：Word/PDF。
- 底稿采用统一模板，专业审计语言、可归档。
- 仅做「序列化/排版」，不做业务推理（推理在 graph/rules/llm）。

## 相关
- 文本生成由 `lib/graph` 的 `workpaperGeneration` 节点（调用 `lib/llm`）完成；本模块负责落地为文件。
