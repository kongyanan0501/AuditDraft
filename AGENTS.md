# AGENTS.md — AuditDraft AI

> AI agent 的项目主上下文文件。Cursor 会自动加载本文件。修改代码前请先读完本文件，再读取目标模块就近的 `AGENTS.md`。

## 1. 项目是什么

**AuditDraft AI** — 智能审计底稿生成 + 风险识别 + 可解释审计系统。

把传统审计流程「Excel 数据 → 人工分析 → 手工编写底稿（2~4 小时）」升级为「Excel → AI 审计流程 → 自动生成标准审计底稿（30 秒）」。

核心能力：
- AI Agent 审计流程编排（**LangGraph**）
- 审计知识库增强（**RAG + Pinecone**）
- 规则引擎 + LLM 混合推理（确定性 + 生成式）
- 自动生成审计工作底稿（Word / PDF）
- 可解释 AI 审计决策（每个结论附触发规则 / 数据证据 / 审计标准）

## 2. 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | Next.js 14+ (App Router)、React Server Components、TailwindCSS、shadcn/ui |
| BFF | Next.js API Routes |
| 数据库 / 认证 | Supabase（Postgres + Auth + Storage） |
| LLM | OpenAI / Claude（通过 `LLMProvider` 接口解耦，可替换） |
| RAG | Pinecone 向量库 |
| 编排 | LangGraph 审计工作流引擎 |
| 语言 | TypeScript（严格模式） |

## 3. 目录结构（就近读取 AGENTS.md）

```
AuditDraft/
├── AGENTS.md                  # 本文件：项目主上下文
├── ARCHITECTURE.md            # 系统架构总览（先读）
├── todo.md                    # 路线图与任务追踪
├── README.md                  # 快速开始
├── .cursor/rules/             # 分域规则（自动按文件路径生效）
├── docs/architecture/         # 详细架构文档（AI 系统 / 数据模型 / UI）
└── src/
    ├── app/                   # Next.js 路由、页面、API Routes(BFF)
    ├── components/            # UI 组件（基于 shadcn/ui）
    ├── types/                 # 共享 TypeScript 类型
    └── lib/
        ├── llm/      AGENTS.md # LLM 抽象层（解耦，可替换 provider）
        ├── rag/      AGENTS.md # RAG 检索（Pinecone）
        ├── rules/    AGENTS.md # 确定性规则引擎（不依赖 LLM）
        ├── graph/    AGENTS.md # LangGraph 审计流程编排
        ├── supabase/ AGENTS.md # Supabase 客户端与数据访问
        └── export/             # 底稿/报告导出（Word/PDF）
```

## 4. 核心架构原则（修改代码必须遵守）

1. **解耦优先**：`LLM / RAG / DB / Rule Engine / UI` 均可独立替换。新增能力时面向接口编程，不要把 provider 细节泄漏到业务层。
2. **混合推理职责分离**：
   - LLM 负责「理解与生成」（审计计划、底稿文本）。
   - Rule Engine 负责「确定性检测」（重复付款、缺审批等），**不依赖 LLM**，保证可靠性与可复现。
   - RAG 负责「专业知识增强」（审计准则、风险规则、案例）。
3. **可解释性是硬约束**：任何风险结论都必须能产出 `触发规则 / 数据证据 / 审计标准引用 / 风险解释`。不要生成无证据的结论。
4. **审计流程是一张图**：业务流程通过 LangGraph 节点编排，节点顺序见 `src/lib/graph/AGENTS.md`，不要在节点外硬编码流程。
5. **数据隔离**：所有审计数据按 `user_id` 隔离，依赖 Supabase RLS。

## 5. 审计工作流（LangGraph 节点顺序）

```
parseData → auditPlanner(LLM+RAG) → ruleEngine(deterministic)
→ anomalyDetection → riskAssessment → workpaperGeneration → reportExport
```

## 6. 协作约定

- **语言**：与用户对话用中文；代码标识符、注释用英文。
- **改动前**：先读 `ARCHITECTURE.md` 与目标模块 `AGENTS.md`，确认是否已有可复用的抽象。
- **改动后**：同步更新 `todo.md` 的任务状态；若引入新模块，补一个就近 `AGENTS.md`。
- **不要**：把密钥写进代码（用 `.env.local`）；绕过 `LLMProvider` 直接调 SDK；让 Rule Engine 依赖 LLM。
- **前端**遵循 `.cursor/rules/frontend.mdc` 与 vercel-react-best-practices skill。
- **Supabase** 相关遵循 `.cursor/rules/supabase.mdc` 与 supabase skill。

## 7. 关键文件索引

| 想了解 | 看这里 |
| --- | --- |
| 整体架构 / 数据流 | `ARCHITECTURE.md` |
| AI 系统（LLM/RAG/Rule/Graph）细节 | `docs/architecture/ai-system.md` |
| 数据库表结构 | `docs/architecture/data-model.md` |
| UI 布局与设计系统 | `docs/architecture/ui-system.md` |
| 当前进度与下一步 | `todo.md` |
