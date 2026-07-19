# AGENTS.md — src/lib/eval（离线 Golden 评测）

## 职责
对规则引擎做可复现的离线评测（Precision / Recall / F1 + 可解释性检查）。**不依赖 LLM / 网络**。

## 入口
- `runGoldenEval()` — 读 `evals/golden/*.json` + `samples/*`，写结果由 CLI/测试负责
- CLI：`npm run eval:golden`

## 规则
- 只调用 `runRules` / `parseAuditFile`
- 阈值写在 golden JSON 的 `thresholds` 字段
