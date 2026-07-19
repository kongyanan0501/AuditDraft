# AGENTS.md — src/lib/export（底稿/报告导出）

## 职责
把审计结果导出为标准审计底稿（Word / PDF）与报告。

## 规则
- 输入：结构化报告（含 `AuditFinding[]` 与底稿文本），输出：Word/PDF。
- Word（档 A 演示版式）：封面签核栏、W/P 索引表、已执行程序对照表、例外明细表、叙述正文、免责；结构化结论以表格为准。
- 仅做「序列化/排版」，不做业务推理（推理在 graph/rules/llm）。

## 相关
- 文本生成由 `lib/graph` 的 `workpaperGeneration` 节点（调用 `lib/llm`）完成；本模块负责落地为文件。
