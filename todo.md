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

- [ ] 接入 Supabase 客户端：`lib/supabase/{server,browser,middleware}.ts`（`@supabase/ssr`）
- [ ] `middleware.ts`：刷新 Session + 保护路由
- [ ] 建表迁移 `supabase/migrations/*.sql`：`audit_jobs` / `audit_reports` / `audit_raw_data`
- [ ] 为三张表开启 RLS：`audit_jobs` 用 `auth.uid() = user_id`；子表经 `job_id → audit_jobs.user_id` 校验归属
- [ ] Auth 流程：注册 / 登录 / 登出 / Session（`signUp` / `signInWithPassword`）
- [ ] Storage bucket：Excel/CSV 上传（私有 bucket + 按 user 隔离）
- [ ] repository 函数：`createJob / getJobs / saveReport / saveRawData`

### ✅ 阶段验证
- [ ] `typecheck + lint + build` 通过
- [ ] 注册新用户 → 邮箱出现在 Supabase `auth.users`
- [ ] 登录后 Session 持久化；登出后访问受保护页被重定向到登录页
- [ ] **RLS 验证**：用户 A 无法查询/读取用户 B 的 `audit_jobs`（用两个账号实测或 SQL 模拟 `auth.uid()`）
- [ ] 上传一个 CSV → Storage 出现文件且 `audit_jobs` 新增一条 `status='pending'` 记录
- [ ] service role key 不出现在客户端 bundle（搜索构建产物确认）

---

## 阶段 2 · AI 核心（解耦模块，可独立单测）

### 2.1 LLM 层 `lib/llm`
- [ ] 定义 `LLMProvider` 接口（`generate(prompt)`）
- [ ] 实现 OpenAI provider 与 Anthropic provider
- [ ] `getLLM()` 工厂：按 `LLM_PROVIDER` 环境变量选择
- [ ] `prompts/`：Audit Planner / Executor / Risk Engine / Workpaper 四套模板

### 2.2 RAG 层 `lib/rag`
- [ ] 实现 `retrieve(query): Promise<string[]>`（embedding → Pinecone → Top-K）
- [ ] 知识库灌入脚本 `scripts/seed-rag.ts`（准则 / 风险规则 / 程序 / 案例）

### 2.3 规则引擎 `lib/rules`
- [ ] 纯函数：`duplicate_payment` / `missing_approval` / `split_expense` / `abnormal_amount`
- [ ] 规则注册表 + `runRules(transactions): AuditFinding[]`
- [ ] 每个 finding 带 `triggeredRule` 与 `evidence`

### 2.4 编排 `lib/graph`
- [ ] LangGraph 7 节点：`parseData → auditPlanner → ruleEngine → anomalyDetection → riskAssessment → workpaperGeneration → reportExport`
- [ ] 节点间共享 state 类型定义
- [ ] 失败节点更新 `audit_jobs.status='failed'`

### 2.5 导出 `lib/export`
- [ ] Word 导出（底稿模板）
- [ ] PDF 导出

### ✅ 阶段验证
- [ ] `typecheck + lint + build` 通过
- [ ] **LLM**：切换 `LLM_PROVIDER=openai|anthropic`，同一 prompt 都能返回结果（provider 可替换）
- [ ] **RAG**：对「重复付款」查询，`retrieve()` 返回相关知识条目（Top-K 命中率人工抽检）
- [ ] **规则引擎单测**：用 `initial.md` 的演示数据，断言能命中重复付款(行1&2)、无审批大额(行4)等预期 finding；纯函数测试不触发任何网络调用
- [ ] **图**：以 mock LLM 跑通 7 节点，state 在节点间正确流转，最终产出 `AuditReport`
- [ ] **导出**：生成的 Word/PDF 能正常打开且含风险与底稿内容

---

## 阶段 3 · 数据与流程端到端打通

- [ ] `parseData`：Excel/CSV → `Transaction[]`（列映射 + 校验）
- [ ] API Route `POST /api/audit`：触发工作流（鉴权 + 异步执行）
- [ ] 任务状态机：`pending → running → done/failed` 落库
- [ ] 结果写入 `audit_reports.report_json`（结构 = `AuditReport`）
- [ ] 可解释性：每个风险输出 触发规则 / 证据 / 标准 / 解释

### ✅ 阶段验证
- [ ] `typecheck + lint + build` 通过
- [ ] **端到端**：上传 `expense_transactions.csv` → 30 秒内 `audit_jobs.status` 变为 `done`
- [ ] `audit_reports` 出现一条记录，`report_json` 含 `findings[]` 与 `workpaper`
- [ ] 每个 finding 四要素齐全（`triggeredRule/evidence/standardRef/explanation`），无空证据结论
- [ ] 内置风险全部被识别：重复付款 / 拆分报销 / 无审批大额 / 重复发票
- [ ] 异常输入（坏 CSV）→ 任务 `failed` 且前端有可读错误

---

## 阶段 4 · 前端工作台（Notion × Palantir 风格）

- [ ] Layout：TopBar + Sidebar（Jobs / Reports / RAG）+ Main Workspace
- [ ] 上传页：拖拽上传 CSV/Excel + 任务列表
- [ ] Workflow Tracker：7 节点流程可视化 + 实时状态（轮询/订阅）
- [ ] Risk Cards：按 severity 着色（high `#ef4444` / medium `#f59e0b` / low `#22c55e`）
- [ ] Audit Report Viewer：Notion 风格可折叠底稿 + 风险高亮
- [ ] Explainability Panel：规则原因 / 数据证据 / 标准引用
- [ ] 一键导出 Word/PDF 按钮

### ✅ 阶段验证
- [ ] `typecheck + lint + build` 通过
- [ ] 完整走查：登录 → 上传 → 看到流程实时推进 → 报告展示 → 导出
- [ ] 配色符合 `ui-system.md`；风险卡片颜色随 severity 正确变化
- [ ] Explainability Panel 能展开看到每条结论的证据与标准引用
- [ ] 响应式：笔记本屏幕（≤1440px）布局不破版
- [ ] 遵循 `vercel-react-best-practices`（RSC 优先、无明显多余 re-render）

---

## 阶段 5 · 大赛冲刺

- [ ] 内置演示数据集 `expense_transactions.csv`（含重复付款/拆分/无审批/重复发票）
- [ ] Prompt 工程四件套调优（Planner / Executor / Risk Engine / Workpaper）
- [ ] 种子 RAG 知识库（足够覆盖 demo 风险类型）
- [ ] Demo 脚本与评委演示流程（含话术）
- [ ] 部署：Vercel（前端/BFF）+ Supabase（DB/Auth）+ Pinecone（RAG）
- [ ] 性能：单次审计 ≤ 30 秒

### ✅ 阶段验证
- [ ] 生产环境（Vercel 部署后的 URL）完整跑通 demo 流程
- [ ] 端到端耗时实测 ≤ 30 秒（记录数字用于路演）
- [ ] 冷启动后用全新账号也能复现 demo（无本地脏数据依赖）
- [ ] 演示脚本走查一遍无卡点；准备好「可解释性」亮点截图

---

## 技术债 / 待决策

- [ ] LLM 默认 provider 选型（成本 vs 质量）
- [ ] RAG 知识库初始语料来源与版权
- [ ] 底稿模板格式标准（事务所是否有既定模板）
- [ ] 是否引入测试框架（Vitest）作为规则引擎/解析器的回归保障
- [ ] 长任务执行方式（同步 API vs 队列/后台 job）
