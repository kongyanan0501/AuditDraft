# ARCHITECTURE — AuditDraft AI 系统架构

> 系统架构总览。AI agent 在做跨模块改动前应先读本文件，再深入 `docs/architecture/*` 与模块 `AGENTS.md`。
> 本文档来源于规划文档 `initial.md`，是其工程化落地版本。

## 1. 设计目标

| 目标 | 实现方式 |
| --- | --- |
| 审计效率提升 80%+ | LangGraph 自动编排审计流程，30 秒产出底稿 |
| 降低人为错误 | 确定性规则引擎做硬性检测，不依赖 LLM |
| 标准化审计输出 | Workpaper Generator 统一底稿模板 |
| 可解释 AI 决策 | 每个结论携带 规则 / 证据 / 标准 / 解释 |
| 企业级可落地 | Supabase 多租户 + 模块全解耦 + SaaS 架构 |

## 2. 系统总体架构

```text
                ┌────────────────────────────┐
                │      Next.js Frontend      │
                │   (UI + API Routes BFF)    │
                └────────────┬───────────────┘
                             │
         ┌───────────────────┼────────────────────┐
         ▼                   ▼                     ▼
   LLM Service          RAG Service          Data Service
 (OpenAI/Claude)        (Pinecone)          (Supabase DB)
         │                   │                     │
         └────────────┬──────┴────────┬────────────┘
                      ▼
           🧠 LangGraph Orchestrator
        (Audit Workflow Engine / Agent System)
                      ▼
        ┌────────────────────────────┐
        │ Audit Output Generator     │
        │ (Report / Word / PDF)      │
        └────────────────────────────┘
```

## 3. 分层与模块映射

| 架构层 | 代码位置 | 职责 |
| --- | --- | --- |
| 表现层 (UI) | `src/app/`、`src/components/` | 工作台、流程可视化、风险卡片、报告查看 |
| BFF 层 | `src/app/api/` | 编排调用、鉴权、聚合返回前端 |
| 编排层 | `src/lib/graph/` | LangGraph 审计工作流引擎（节点 + 状态） |
| 能力层 | `src/lib/llm/`、`src/lib/rag/`、`src/lib/rules/` | LLM 生成 / RAG 检索 / 确定性规则 |
| 输出层 | `src/lib/export/` | 底稿与报告导出（Word/PDF） |
| 数据层 | `src/lib/supabase/` | 认证、任务、报告、原始数据存取 |

> 解耦原则：上层只依赖下层的**接口**，不依赖具体实现。详见各模块 `AGENTS.md`。

## 4. 核心数据流（一次审计任务）

```text
1. 用户上传 Excel/CSV          → src/app (上传) → Supabase Storage + audit_jobs
2. 触发审计任务                → src/app/api → src/lib/graph (启动工作流)
3. parseData                  → 解析为结构化交易数据 → audit_raw_data
4. auditPlanner (LLM + RAG)   → 检索审计准则/规则 → 生成审计计划
5. ruleEngine (deterministic) → 重复付款/缺审批/拆分报销/异常金额
6. anomalyDetection           → 异常检测
7. riskAssessment             → 风险评级 + 内控判断
8. workpaperGeneration (LLM)  → 生成标准审计底稿文本
9. reportExport               → audit_reports 落库 + Word/PDF 导出
10. 前端展示                   → 流程状态 / 风险卡片 / 可解释面板 / 报告
```

## 5. 混合推理架构（关键）

三类能力职责严格分离，互不越界：

| 能力 | 模块 | 角色 | 是否依赖 LLM |
| --- | --- | --- | --- |
| 理解与生成 | `lib/llm` | 审计计划、底稿文本、自然语言解释 | ✔ |
| 确定性检测 | `lib/rules` | 重复付款、缺审批、拆分报销等硬规则 | ✘（保证可复现） |
| 知识增强 | `lib/rag` | 注入审计准则 / 风险规则 / 程序 / 案例 | 作为 LLM 上下文 |

**为什么这样设计**：规则引擎给出确定、可审计、可复现的结论；LLM 负责难以规则化的理解与表达；RAG 让 LLM 的输出锚定在专业知识上。三者结合既可靠又可解释。

## 6. 可解释性契约

任何风险结论都必须可序列化为如下结构（贯穿 rules / graph / UI）：

```ts
interface AuditFinding {
  riskType: string;        // e.g. "duplicate_payment"
  severity: "low" | "medium" | "high";
  triggeredRule: string;   // 触发的规则 / 判断依据
  evidence: unknown;       // 命中的原始数据证据
  standardRef?: string;    // 引用的审计准则（来自 RAG）
  explanation: string;     // 自然语言解释
}
```

## 7. 解耦与可替换性矩阵

| 模块 | 可替换 | 替换方式 |
| --- | --- | --- |
| LLM | ✔ | 新增实现 `LLMProvider` 接口的 provider |
| RAG | ✔ | 替换向量库实现，保持 `retrieve()` 契约 |
| DB | ✔ | 数据访问集中在 `lib/supabase`，对上暴露 repository |
| Rule Engine | ✔ | 规则为独立纯函数，按需增删 |
| UI | ✔ | 组件化，依赖 BFF 返回的标准结构 |

## 8. 详细设计文档

- AI 系统（LLM / RAG / Rule Engine / LangGraph / Prompt 工程）→ [`docs/architecture/ai-system.md`](./docs/architecture/ai-system.md)
- 数据模型（Supabase 表结构 / RLS / 知识库结构）→ [`docs/architecture/data-model.md`](./docs/architecture/data-model.md)
- UI 系统（布局 / 设计系统 / 核心模块）→ [`docs/architecture/ui-system.md`](./docs/architecture/ui-system.md)
