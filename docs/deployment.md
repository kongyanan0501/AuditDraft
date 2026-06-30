# 部署指南 — AuditDraft AI

> 目标拓扑：**Vercel**（前端 + BFF/API Routes）+ **Supabase**（DB/Auth/Storage）+ **Pinecone**（RAG 向量库）+ **OpenAI/Claude**（LLM）。
> 本指南覆盖从零到「线上可跑 demo」的完整步骤。运行时验证（live 实测）需要你的真实账号与密钥。

## 0. 前置

- Node ≥ 20、`npm`
- 账号：Vercel、Supabase、Pinecone、OpenAI（或 Anthropic）

## 1. Supabase（DB / Auth / Storage）

1. 新建 Supabase 项目，记录：
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`（**仅服务端**，切勿暴露到浏览器）
2. 执行迁移（SQL Editor 里按顺序粘贴执行，或用 Supabase CLI）：
   - `supabase/migrations/0001_audit_tables.sql`（建表 `audit_jobs / audit_reports / audit_raw_data` + RLS）
   - `supabase/migrations/0002_storage_bucket.sql`（私有 bucket `audit-uploads` + 按 user 路径隔离）
   - `supabase/migrations/0003_job_error.sql`（`audit_jobs.error` 失败原因列）
3. Auth：Email 登录默认可用。演示建议在 Authentication → Providers 关闭「Confirm email」以便新账号即时可登录（或预先确认邮箱）。

## 2. Pinecone（RAG）

1. 创建 API Key → `PINECONE_API_KEY`。
2. 选定索引名 → `PINECONE_INDEX`（如 `auditdraft`）。索引可由 seed 脚本自动创建（serverless，维度 1536，cosine）。
3. 本地灌库（需先配 `.env.local`）：

```bash
npm run seed:rag   # 建索引（若缺失）→ 向量化 15 条种子知识 → upsert
```

> 知识库定义见 `src/lib/rag/knowledge.ts`（准则 / 风险规则 / 程序 / 舞弊案例）。

## 3. LLM

- 默认 `LLM_PROVIDER=openai`，配 `OPENAI_API_KEY`；或设为 `anthropic` + `ANTHROPIC_API_KEY`。
- 演示建议用「快且省」的模型以满足 ≤30 秒目标（见 §6）。

## 4. 环境变量清单

部署到 Vercel 时，在 Project → Settings → Environment Variables 配置（也用于本地 `.env.local`）：

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓ | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ | service role key（仅服务端） |
| `OPENAI_API_KEY` | ✓* | provider=openai 时必填 |
| `ANTHROPIC_API_KEY` | ✓* | provider=anthropic 时必填 |
| `LLM_PROVIDER` | – | `openai`（默认）\| `anthropic` |
| `PINECONE_API_KEY` | ✓ | Pinecone API key |
| `PINECONE_INDEX` | ✓ | 索引名 |
| `OPENAI_MODEL` | – | 覆盖默认模型（如 `gpt-4o-mini`） |
| `ANTHROPIC_MODEL` | – | 覆盖默认模型 |
| `EMBEDDING_MODEL` | – | 默认 `text-embedding-3-small`（维度需与索引一致） |
| `PINECONE_CLOUD` / `PINECONE_REGION` | – | 仅 seed 首次建索引用（默认 `aws` / `us-east-1`） |

> 校验：`npm run check:env`（缺失则退出码 1 并给出聚合报错）。

## 5. 部署到 Vercel

1. Import 仓库到 Vercel，框架自动识别为 Next.js。
2. 配置 §4 的环境变量。
3. Deploy。`vercel.json` 已为 `POST /api/audit` 设置 `maxDuration: 60`（审计后台任务保活预算）。

### ⚠️ 长任务执行（重要）

审计工作流是「触发即返回 202 + 后台执行 + 前端轮询状态」。在 Serverless 上，函数会在响应返回后被回收，普通 detached promise 会被杀掉。本项目已用 Vercel **`waitUntil`**（`@vercel/functions`，见 `src/app/api/audit/route.ts`）在响应后保活后台任务，预算受 `maxDuration` 约束：

- 单次审计目标 ≤30 秒，落在 `maxDuration: 60` 内，Vercel Hobby/Pro 均可。
- 若未来单任务可能超过 `maxDuration`（如超大数据集 + 慢模型），应改为**队列 / 后台 worker**（如 Supabase Edge Functions / 独立长驻 worker / QStash），或部署到**长驻 Node 平台**（Railway / Render / Fly.io，无函数冻结问题，detached 亦可）。

## 6. 性能（单次审计 ≤ 30 秒）

工作流含 4 次串行 LLM 调用（计划 / 异常分析 / 评级说明 / 底稿生成）+ 1 次 RAG 检索；规则引擎为纯函数（毫秒级）。压缩耗时的杠杆：

- **选快模型**：`OPENAI_MODEL=gpt-4o-mini`（或同级快模型）通常远快于大模型，质量足够 demo。
- **控制输出长度**：prompt 已限制各步输出字数（计划 ≤350 / 异常 ≤300 / 评级 ≤400 字）以减少生成 token。
- **就近部署**：Vercel region 选择靠近 LLM/向量库的区域，降低网络往返。
- **RAG Top-K**：默认 5，已足够；不要盲目调大。

实测命令（线上）：上传 `samples/expense_transactions.csv`，记录从触发到 `status=done` 的墙钟时间，用于路演数字。

## 7. 部署后冒烟验证（对应 todo.md 阶段5 DoD）

- [ ] 用**全新账号**登录线上 URL（验证无本地脏数据依赖）。
- [ ] 上传 `samples/expense_transactions.csv` → 30 秒内 `audit_jobs.status` 变 `done`。
- [ ] 报告含 4 类风险，每条 finding 四要素齐全（触发规则/证据/准则/解释）。
- [ ] 一键导出 Word/PDF 成功。
- [ ] 按 `docs/demo-script.md` 完整走查一遍无卡点。
