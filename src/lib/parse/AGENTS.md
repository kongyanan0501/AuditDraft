# AGENTS.md — src/lib/parse（数据解析层）

## 职责
把上传的审计原始文件（CSV / XLS / XLSX）解析为结构化 `Transaction[]`，做列映射与校验。
对应 LangGraph 的 `parseData` 步骤的「文件 → 交易」前置环节（二进制解析在图外完成，图内 state 只流转 JSON）。

## 契约
```ts
parseAuditFile(buffer: Buffer, filename?: string): Transaction[]
```
- 支持表头别名（中英文，大小写/空白不敏感），见 `HEADER_ALIASES`。
- 必要列：`vendor` / `amount`；`id` / `approver` / `invoice_id` 可缺省。
- 校验失败抛 `ParseError`（可读中文消息），由调用方落库为任务 `failed`。

## 规则
- 纯函数：不依赖网络 / DB / LLM，可单测。
- 基于 `xlsx`（SheetJS）统一解析 CSV 与 Excel。
- 只做「解析 + 校验」，不做风险判断（那是 rules / graph 的事）。

## 相关
- 消费方：`src/lib/graph/run.ts` 的 `executeAuditJob`。
- 领域类型：`src/types/audit.ts` 的 `Transaction`。
