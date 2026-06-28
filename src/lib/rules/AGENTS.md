# AGENTS.md — src/lib/rules（确定性规则引擎）

## 职责
对结构化交易数据做**确定性**风险检测。**不依赖 LLM**，保证可靠、可复现、可审计。

## 规则集
| 规则 | 判定逻辑 |
| --- | --- |
| `duplicate_payment` | same vendor + same amount + same invoice |
| `missing_approval` | amount > 10000 && approver == null |
| `split_expense` | 多笔金额接近审批阈值（疑似拆分） |
| `abnormal_amount` | 金额离群异常 |

## 契约
每条规则是独立**纯函数**：输入交易数据，输出 `AuditFinding[]`（见 `ARCHITECTURE.md` §6）。

## 规则
- 新增规则 = 新增纯函数并注册到规则集合；不要在 graph 节点里内联判断。
- 不引入 LLM / 网络 IO；可单元测试、确定性输出。
- 每个 finding 必须带 `triggeredRule / evidence`。

## 相关
- 设计：`docs/architecture/ai-system.md` §3
