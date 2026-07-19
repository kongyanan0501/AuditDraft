# AuditDraft AI

> 🏆 AI 审计创新大赛参赛作品
> 智能审计底稿生成 + 风险识别 + 可解释审计系统

把传统审计「Excel → 人工分析 → 手工底稿（2~4 小时）」升级为「Excel → AI 审计流程 → 标准审计底稿（30 秒）」。

## 技术栈

`Next.js 14 (App Router)` · `TypeScript` · `TailwindCSS + shadcn/ui` · `Supabase` · `LangGraph` · `RAG (Pinecone)` · `OpenAI / Claude`

## 核心能力

- ⚡ 审计效率提升 80%+
- 🧠 LLM + 规则引擎混合推理
- 📚 RAG 审计知识库增强（准则 / 风险规则 / 程序 / 舞弊案例）
- 🔍 可解释审计：每个结论附「触发规则 + 数据证据 + 审计标准」
- 🏢 SaaS 级多用户架构

## 文档导航

| 文档 | 用途 |
| --- | --- |
| [`AGENTS.md`](./AGENTS.md) | AI agent / 开发者主上下文（**先读这个**） |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | 系统架构总览 |
| [`docs/architecture/`](./docs/architecture/) | AI 系统 / 数据模型 / UI 详细设计 |
| [`docs/deployment.md`](./docs/deployment.md) | 部署指南（Vercel + Supabase + Pinecone） |
| [`docs/demo-script.md`](./docs/demo-script.md) | 通用评委演示流程与话术 |
| [`docs/demo-script-ey.md`](./docs/demo-script-ey.md) | **安永华明赛**演示话术（推荐） |
| [`docs/ey-package-a-tasks.md`](./docs/ey-package-a-tasks.md) | 冲击第一 · 包 A 执行与 Check |
| [`todo.md`](./todo.md) | 开发路线图与任务追踪 |

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量（复制并填写）
cp .env.example .env.local

# 3. 本地开发
npm run dev          # http://localhost:3000

# 其他
npm run build        # 生产构建
npm run typecheck    # 类型检查
npm run lint         # 代码检查
```

> 工程已可启动（Next.js 14 + Tailwind + shadcn 基座）。后续实现进度见 [`todo.md`](./todo.md)。

## 环境变量

完整清单与说明见 [`docs/deployment.md`](./docs/deployment.md) §4；最小必填：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# LLM（默认 openai；可切 anthropic）
LLM_PROVIDER=openai
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# RAG
PINECONE_API_KEY=
PINECONE_INDEX=
```

## 部署与演示

- 部署（Vercel + Supabase + Pinecone）：见 [`docs/deployment.md`](./docs/deployment.md)
- 评委演示流程与话术：见 [`docs/demo-script.md`](./docs/demo-script.md)
- 内置演示数据集：[`samples/expense_transactions.csv`](./samples/expense_transactions.csv)（含重复付款 / 无审批大额 / 拆分报销 / 金额离群）
