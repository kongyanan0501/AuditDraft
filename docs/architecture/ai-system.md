# AI 系统设计

> AuditDraft AI 的核心：LLM 层 / RAG 层 / 规则引擎 / LangGraph 编排 / Prompt 工程。
> 对应代码：`src/lib/{llm,rag,rules,graph}`。

## 1. LLM 层（解耦）

所有模型调用必须经过统一接口，业务层永远不直接 import OpenAI/Anthropic SDK。

```ts
export interface LLMProvider {
  generate(prompt: string): Promise<string>;
  // 结构化输出场景可扩展：
  // generateStructured<T>(prompt: string, schema: ZodSchema<T>): Promise<T>;
}
```

支持：
- OpenAI GPT-4.1
- Claude
- 本地模型（可扩展）

通过环境变量或配置选择默认 provider，调用方只拿到 `LLMProvider`。

## 2. RAG 层（Pinecone）

### 检索流程

```text
Query → Embedding → Pinecone → Top-K Knowledge → LLM
```

### 接口契约

```ts
retrieve(query: string): Promise<string[]>;
```

### 知识类型

1. 审计准则
2. 风险规则
3. 审计程序
4. 舞弊案例

### 知识条目数据结构

```json
{
  "type": "risk_rule",
  "content": "同一供应商+相同金额+重复发票=重复付款风险",
  "risk_level": "high",
  "tags": ["fraud", "duplicate"]
}
```

## 3. 规则引擎（确定性层）

不依赖 LLM，提供确定、可复现、可审计的检测。每条规则是独立纯函数，输入交易数据，输出 `AuditFinding[]`。

| 规则 | 判定逻辑 |
| --- | --- |
| `duplicate_payment` | same vendor + same amount + same invoice |
| `missing_approval` | amount > 10000 && approver == null |
| `split_expense` | 多笔交易金额接近审批阈值（疑似拆分） |
| `abnormal_amount` | 金额异常（离群） |

> 新增规则：在 `src/lib/rules` 添加纯函数并注册到规则集合，不要在节点里内联判断逻辑。

## 4. LangGraph 审计流程引擎

### 工作流节点

```text
parseData
  ↓
auditPlanner (LLM + RAG)
  ↓
ruleEngine (deterministic)
  ↓
anomalyDetection
  ↓
riskAssessment
  ↓
workpaperGeneration
  ↓
reportExport
```

### 设计理念

- LLM 负责「理解与生成」
- Rule Engine 负责「确定性检测」
- RAG 负责「专业知识增强」

> 流程编排集中在 `src/lib/graph`，节点之间通过共享 state 传递；新增/调整步骤只改图定义，不要散落到业务代码。

## 5. Prompt 工程（四大级）

| Prompt | 职责 | 关键产物 |
| --- | --- | --- |
| **Audit Planner** | 风险识别、审计程序生成 | 结构化审计计划 |
| **Audit Executor** | 异常检测、数据分析、规则匹配 | 异常清单 |
| **Risk Engine** | 风险评级、内控判断、审计建议 | 风险评级 + 建议 |
| **Workpaper Generator** | 生成标准审计底稿 | 可归档、专业审计语言的底稿 |

> Prompt 模板建议集中管理（如 `src/lib/llm/prompts/`），便于版本化与复用。

## 6. 可解释 AI 系统

每个结论提供：触发规则 / 数据证据 / 审计标准 / 风险解释。结构见 `ARCHITECTURE.md` 第 6 节 `AuditFinding`。这是整个系统的硬约束——禁止产出没有证据支撑的结论。
