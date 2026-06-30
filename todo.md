# TODO — AuditDraft AI 路线图

> 任务追踪文件。AI agent 完成任务后请更新状态：`[ ]` 未开始 / `[~]` 进行中 / `[x]` 完成。
> 大改动前先在对应阶段补充子任务，保持本文件与实际进度一致。
> 每个阶段末尾的 **✅ 阶段验证** 是该阶段的「完成定义（DoD）」——全部通过才算阶段完成。

## 图例与全局验证命令

```bash
npm run typecheck   # 类型检查（必须 0 error）
npm run lint        # 代码检查（必须 0 error）
npm run build       # 生产构建（必须成功）
npm run check:env   # 环境变量自检（部署前/CI；缺失则退出码 1）
npm run dev         # 本地启动 http://localhost:3000
```

> 约定：每个阶段收尾，至少跑通 `typecheck + lint + build` 三件套，再做该阶段的专项验证。

---

## 阶段 0 · 架构初始化 ✅ 已完成

- [x] 解析规划文档 `initial.md`
- [x] 建立 agent harness：根 `AGENTS.md` + 模块 `AGENTS.md`
- [x] 编写 `ARCHITECTURE.md` 与 `docs/architecture/*`
- [x] 配置 `.cursor/rules/*.mdc` 分域规则
- [x] 搭建 `src/` 目录骨架
- [x] 初始化 Next.js 14 工程（`package.json` / `tsconfig` / `tailwind` / `shadcn` 基座）
- [x] 配置 `.env.example`
- [x] 补充环境变量校验（`src/lib/env.ts` 分组惰性校验 + `scripts/check-env.ts` + `npm run check:env`）

### ✅ 阶段验证
- [x] `npm run typecheck` 通过
- [x] `npm run build` 成功（4 路由静态生成）
- [x] `npm run dev` 首页 `http://localhost:3000` 正常渲染
- [x] 缺少必填环境变量时 `npm run check:env` 给出明确聚合报错并退出码 1；变量齐全时通过

---

## 阶段 1 · 基础设施（Supabase 认证与数据）

- [x] 接入 Supabase 客户端：`lib/supabase/{server,browser,middleware}.ts`（`@supabase/ssr`）+ `admin.ts`（service role）+ `types.ts`
- [x] `middleware.ts`：刷新 Session + 保护路由（`/dashboard` 需登录；已登录访问 `/login`、`/register` 跳转 dashboard）
- [x] 建表迁移 `supabase/migrations/*.sql`：`audit_jobs` / `audit_reports` / `audit_raw_data`（`0001_audit_tables.sql`）
- [x] 为三张表开启 RLS：`audit_jobs` 用 `auth.uid() = user_id`；子表经 `job_id → audit_jobs.user_id` 校验归属（`TO authenticated` + USING/WITH CHECK）
- [x] Auth 流程：注册 / 登录 / 登出 / Session（`src/app/(auth)`：`signUp` / `signInWithPassword` / `signOut`）
- [x] Storage bucket：Excel/CSV 上传（私有 `audit-uploads` + 按 user 路径隔离，`0002_storage_bucket.sql`）
- [x] repository 函数：`createJob / getJobs / getJob / updateJobStatus / setJobStoragePath / saveReport / saveRawData / uploadAuditFile`
- [x] 受保护工作台 `/dashboard`：任务列表 + CSV/Excel 上传（验证用）

### ✅ 阶段验证
- [x] `typecheck + lint + build` 通过
- [x] service role key 不出现在客户端 bundle（已搜索 `.next/static` 确认无 `SERVICE_ROLE` / `createAdminClient`）
- [ ] 注册新用户 → 邮箱出现在 Supabase `auth.users`（需配置 `.env.local` 与真实 Supabase 项目 + 跑迁移后实测）
- [ ] 登录后 Session 持久化；登出后访问受保护页被重定向到登录页（同上，需 live 实测）
- [ ] **RLS 验证**：用户 A 无法查询/读取用户 B 的 `audit_jobs`（用两个账号实测或 SQL 模拟 `auth.uid()`）
- [ ] 上传一个 CSV → Storage 出现文件且 `audit_jobs` 新增一条 `status='pending'` 记录（live 实测）

> 说明：代码与迁移已就绪；剩余 4 项为运行时验证，需先在 `.env.local` 配置真实 Supabase 项目并执行 `supabase/migrations/*.sql`（建表 + RLS + bucket），再用真实账号走查。

---

## 阶段 2 · AI 核心（解耦模块，可独立单测）

### 2.1 LLM 层 `lib/llm`
- [x] 定义 `LLMProvider` 接口（`generate(prompt, options?)`，`types.ts`）
- [x] 实现 OpenAI provider 与 Anthropic provider（`providers/{openai,anthropic}.ts`，均 server-only）
- [x] `getLLM()` 工厂：按 `LLM_PROVIDER` 环境变量选择（`index.ts`，带缓存 + `resetLLM`）
- [x] `prompts/`：Audit Planner / Executor / Risk Engine / Workpaper 四套模板（纯函数 builder）

### 2.2 RAG 层 `lib/rag`
- [x] 实现 `retrieve(query): Promise<string[]>`（OpenAI embedding → Pinecone Top-K；`createRetriever` 可注入依赖）
- [x] 向量库 / embedding 抽象（`VectorStore` / `Embedder`），Pinecone 实现内聚于 `pinecone.ts`
- [x] 知识库灌入脚本 `scripts/seed-rag.ts` + `knowledge.ts`（准则 / 风险规则 / 程序 / 案例）；`npm run seed:rag`

### 2.3 规则引擎 `lib/rules`
- [x] 纯函数：`duplicate_payment` / `missing_approval` / `split_expense` / `abnormal_amount`（各独立文件）
- [x] 规则注册表 `RULE_REGISTRY` + `runRules(transactions, ruleIds?)`
- [x] 每个 finding 带 `triggeredRule` / `evidence` / `explanation`

### 2.4 编排 `lib/graph`
- [x] LangGraph 7 节点：`parseData → auditPlanner → ruleEngine → anomalyDetection → riskAssessment → workpaperGeneration → reportExport`
- [x] 共享 state 类型（`state.ts` Annotation.Root）；依赖注入式节点（`createNodes(deps)`）便于 mock 单测
- [x] 失败节点更新 `audit_jobs.status='failed'`（`run.ts` 运行器维护状态机）

### 2.5 导出 `lib/export`
- [x] Word 导出（`docx`，完整中文支持）
- [x] PDF 导出（`pdfkit`；中文需配置 `PDF_CJK_FONT_PATH`，否则降级为可读结构）

### ✅ 阶段验证
- [x] `typecheck + lint + build` 通过
- [ ] **LLM**：切换 `LLM_PROVIDER=openai|anthropic`，同一 prompt 都能返回结果（provider 可替换）→ 需 live key 实测
- [ ] **RAG**：对「重复付款」查询，`retrieve()` 返回相关知识条目（Top-K 命中率人工抽检）→ 需先 `npm run seed:rag` + live Pinecone
- [x] **规则引擎单测**：`tests/rules.test.ts` 用演示数据断言命中重复付款(行1&2)、无审批大额(行4)；纯函数无网络调用
- [x] **图**：`tests/graph.test.ts` 以 mock LLM 跑通 7 节点，state 正确流转，产出 `AuditReport`
- [x] **导出**：`tests/export.test.ts` 断言生成的 Word(PK)/PDF(%PDF) 为合法文件且含风险与底稿内容

> 说明：模块代码与单测（`npm run test`，12 项全绿）已就绪。剩余 2 项为运行时验证，需在 `.env.local`
> 配置真实 OpenAI / Anthropic / Pinecone key，并先 `npm run seed:rag` 灌库后实测。

---

## 阶段 3 · 数据与流程端到端打通

- [x] `parseData`：Excel/CSV → `Transaction[]`（`src/lib/parse`，列映射 + 校验 + 可读 `ParseError`，基于 xlsx）
- [x] API Route `POST /api/audit`：鉴权（RLS 校验归属）+ detached 异步执行工作流，返回 202
- [x] 任务状态机：`pending → running → done/failed` 落库（`executeAuditJob` + admin 客户端）
- [x] 结果写入 `audit_reports.report_json`（结构 = `AuditReport`）；原始交易写入 `audit_raw_data`
- [x] 可解释性：每个 finding 含 `triggeredRule / evidence / standardRef / explanation`（规则内置准则引用）
- [x] 失败原因落库：迁移 `0003_job_error.sql` 新增 `audit_jobs.error`，前端展示
- [x] 前端：上传后自动触发审计 + 运行/重试按钮 + 轻量轮询刷新

### ✅ 阶段验证
- [x] `typecheck + lint + build` 通过；`npm run test` 17 项全绿（含解析 + 4 类风险识别）
- [ ] **端到端**：上传 `expense_transactions.csv` → 30 秒内 `audit_jobs.status` 变为 `done` → 需 live key + 跑迁移实测
- [ ] `audit_reports` 出现一条记录，`report_json` 含 `findings[]` 与 `workpaper` → 同上（live）
- [x] 每个 finding 四要素齐全（`triggeredRule/evidence/standardRef/explanation`），无空证据结论（`tests/rules.test.ts` 断言）
- [x] 内置风险全部被识别：重复付款 / 拆分报销 / 无审批大额 / 重复发票（`tests/parse.test.ts` 用演示数据集断言）
- [x] 异常输入（坏 CSV）→ `ParseError`（`tests/parse.test.ts`）；运行器落库 `failed` 且前端展示 `error`

> 说明：端到端打通的代码与单测已就绪。演示数据集见 `samples/expense_transactions.csv`（含 4 类风险）。
> 剩余 2 项为运行时验证，需 `.env.local` 配真实 key、执行 `supabase/migrations/*.sql`（含 `0003`）、
> `npm run seed:rag` 后用真实账号上传走查。
>
> 决策（技术债「长任务执行方式」）：阶段3采用 **API 触发 + detached 异步执行 + 任务状态机轮询**。
> 适合本地与长驻 Node；Serverless 长任务（>限额）后续可换队列/后台 job（阶段5 部署再评估）。

---

## 阶段 4 · 前端工作台（Notion × Palantir 风格）✅ 已完成

- [x] Layout：TopBar + Sidebar（Jobs / Reports / RAG）+ Main Workspace（`(app)/layout.tsx` 外壳 + `SidebarNav` 客户端高亮，`max-w-[1400px]` 容器）
- [x] 上传页：CSV/Excel 上传 + 任务列表（`/dashboard`，任务行链接详情、状态徽章、运行/重试按钮、失败原因）
- [x] Workflow Tracker：7 节点流程可视化 + 实时状态（`WorkflowTracker` 按 job 状态推导节点态 + `StatusPoller` 轮询刷新）
- [x] Risk Cards：按 severity 着色（high `#ef4444` / medium `#f59e0b` / low `#22c55e`，配色集中在 `severity.ts`）
- [x] Audit Report Viewer：Notion 风格可折叠底稿（`ReportViewer` 轻量 Markdown 渲染 + 原生 `<details>` 分节，零 JS）
- [x] Explainability Panel：规则原因 / 数据证据 / 标准引用（内置于 `RiskCard` 的可折叠区，展开见四要素）
- [x] 一键导出 Word/PDF 按钮（`ExportButtons` 原生下载链接 → `GET /api/audit/[jobId]/export`，鉴权 + RLS）

### ✅ 阶段验证
- [x] `typecheck + lint + build` 通过（build 9 路由；`npm run test` 17 项全绿）
- [ ] 完整走查：登录 → 上传 → 看到流程实时推进 → 报告展示 → 导出（需 live key + 跑迁移实测）
- [x] 配色符合 `ui-system.md`；风险卡片颜色随 severity 正确变化（`severity.ts` 锁定 risk 配色，单一 accent）
- [x] Explainability Panel 能展开看到每条结论的证据与标准引用（`RiskCard` 折叠区渲染 `triggeredRule/evidence/standardRef`）
- [x] 响应式：笔记本屏幕（≤1440px）布局不破版（侧栏 `md:` 断点折叠为顶部导航，主区 `min-w-0` + Grid）
- [x] 遵循 `vercel-react-best-practices`（RSC 优先：页面/卡片/查看器均为 Server Component，客户端仅 `SidebarNav`/`StatusPoller`/`RunAuditButton`/`UploadForm` 叶子岛；首屏 JS ≤ ~99KB）

> 说明：UI 全部就绪并通过三件套 + 测试 + 无 client bundle 泄漏（`.next/static` 无 `getReportByJobId`/`SERVICE_ROLE` 等）。
> 唯一剩余「完整走查」为运行时验证，需 `.env.local` 配真实 key、执行 `supabase/migrations/*.sql`、`npm run seed:rag` 后实测。

---

## 阶段 5 · 大赛冲刺

- [x] 内置演示数据集 `expense_transactions.csv`（含重复付款/拆分/无审批/金额离群；4 类风险，阈值 10000）
- [x] Prompt 工程四件套调优（Planner / Executor / Risk Engine / Workpaper）——加 `EXPLAINABILITY_GUARD` 硬约束 + 结构化模板 + 字数上限控耗时
- [x] 种子 RAG 知识库（扩至 15 条：4 风险规则 + 审批阈值规则 + 5 准则 + 3 程序 + 3 案例，覆盖全部 demo 风险）
- [x] Demo 脚本与评委演示流程（含话术）→ `docs/demo-script.md`
- [x] 部署产物就绪：`vercel.json`（audit 路由 `maxDuration:60`）+ `waitUntil` 后台保活 + `docs/deployment.md`；**实际部署需用户真实账号/密钥**
- [x] 性能策略落地（控输出字数 + 选快模型指引）；**实测 ≤30 秒需 live 环境**

### ✅ 阶段验证
- [ ] 生产环境（Vercel 部署后的 URL）完整跑通 demo 流程 → 需用户配 key + 部署后实测
- [ ] 端到端耗时实测 ≤ 30 秒（记录数字用于路演）→ 同上（live）
- [ ] 冷启动后用全新账号也能复现 demo（无本地脏数据依赖）→ 同上（live）
- [ ] 演示脚本走查一遍无卡点；准备好「可解释性」亮点截图 → 脚本已就绪（`docs/demo-script.md`），走查与截图需 live 环境

> 说明：阶段5 代码侧与文档已全部就绪（演示数据 / Prompt 调优 / RAG 扩库 / Demo 话术 / 部署产物）。
> 长任务在 Vercel 用 `@vercel/functions` 的 `waitUntil` 保活（替换原 detached promise），落在 `maxDuration:60` 预算内。
> 剩余 4 项均为运行时验证：需在 Vercel/Supabase/Pinecone 配置真实 key、跑迁移、`npm run seed:rag` 后按 `docs/deployment.md` §7 走查。

---

## 技术债 / 待决策

- [ ] LLM 默认 provider 选型（成本 vs 质量）
- [ ] RAG 知识库初始语料来源与版权
- [ ] 底稿模板格式标准（事务所是否有既定模板）
- [x] 是否引入测试框架（Vitest）作为规则引擎/解析器的回归保障 → 阶段2 已引入 Vitest（`npm run test`）
- [x] 长任务执行方式（同步 API vs 队列/后台 job）→ 阶段3 决策：API 触发 + detached 异步 + 状态机轮询；Serverless 限额场景后续换队列
