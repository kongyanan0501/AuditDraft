# AGENTS.md — src/lib/audit（安永向增强：重要性 / 程序 / 定稿）

## 职责
在规则 findings 之上附加事务所友好字段：重要性影响、建议程序、复核状态、轨迹与规则版本。

## 入口
- `finalizeReport` — 工作流落库前定稿
- `enrichFindings` — UI 展示时补齐旧报告字段
- `getMaterialityConfig` — 读 env 重要性参数

## 规则
- 不替代 rules 的确定性判定；只做增强与元数据。
- 复核状态变更走 repository，并追加 trail 事件。
