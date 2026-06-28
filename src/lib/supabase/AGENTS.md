# AGENTS.md — src/lib/supabase（数据访问层）

## 职责
封装 Supabase 客户端、认证与数据存取。对上层暴露 repository 风格函数。

## 文件
- `server.ts` — 服务端 RLS 客户端（RSC / Server Action / Route Handler），绑定请求 cookies。
- `browser.ts` — 浏览器客户端，仅用 `NEXT_PUBLIC_*` 公钥。
- `middleware.ts` — `updateSession()`：刷新 Session + 路由保护（被根 `middleware.ts` 调用）。
- `admin.ts` — service role 客户端（`import "server-only"`，绕过 RLS，仅可信服务端流程用）。
- `repository.ts` — 数据访问函数（见下）。
- `types.ts` — `Database` 泛型与行类型 + `AUDIT_UPLOADS_BUCKET` 常量。

> 类型注意：行类型必须用 `type` 而非 `interface`——interface 无隐式索引签名，
> 不满足 supabase-js 的 `GenericSchema`，会让 `Schema` 退化为 `never` 丢失 insert/update 类型。

## 客户端
- server client / browser client / middleware 分开（`@supabase/ssr`，`getAll`/`setAll` cookie API）。
- service role key **仅服务端**使用，绝不进客户端 bundle（`admin.ts` 用 `server-only` 兜底）。
- Session 校验统一用 `auth.getUser()`（会向 Auth 服务核验），不要用 `getSession()` 做鉴权。

## 表
`audit_jobs` / `audit_reports` / `audit_raw_data`（结构见 `docs/architecture/data-model.md`）。
迁移在 `supabase/migrations/`：`0001_audit_tables.sql`（表 + RLS）、`0002_storage_bucket.sql`（私有 bucket + 存储策略）。

## repository 函数
`requireUser` / `createJob` / `getJobs` / `getJob` / `updateJobStatus` / `setJobStoragePath`
/ `saveReport` / `saveRawData` / `uploadAuditFile`。默认走 RLS 客户端，按当前用户隔离。

## 规则
- 业务层不直接拼 SQL，统一走本模块的 repository 函数。
- 所有含 `user_id` 的表启用 RLS（`auth.uid() = user_id`）；子表通过 `job_id → audit_jobs.user_id` 校验归属。
- 策略统一 `TO authenticated` + 归属断言；UPDATE 同时给 `USING` 与 `WITH CHECK`。
- 认证：`signUp` / `signInWithPassword` / `signOut` / Session；严格用户隔离。
- Storage 对象路径约定 `{user_id}/{job_id}/{filename}`，策略按路径首段 = `auth.uid()` 隔离。

## 相关
- 设计：`docs/architecture/data-model.md`
- 规则：`.cursor/rules/supabase.mdc`、`supabase` skill
