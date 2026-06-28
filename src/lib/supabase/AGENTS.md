# AGENTS.md — src/lib/supabase（数据访问层）

## 职责
封装 Supabase 客户端、认证与数据存取。对上层暴露 repository 风格函数。

## 客户端
- server client / browser client / middleware 分开（`@supabase/ssr`）。
- service role key **仅服务端**使用，绝不进客户端 bundle。

## 表
`audit_jobs` / `audit_reports` / `audit_raw_data`（结构见 `docs/architecture/data-model.md`）。

## 规则
- 业务层不直接拼 SQL，统一走本模块的 repository 函数。
- 所有含 `user_id` 的表启用 RLS（`auth.uid() = user_id`）；子表通过 `job_id → audit_jobs.user_id` 校验归属。
- 认证：`signUp` / `signInWithPassword` / Session；严格用户隔离。

## 相关
- 设计：`docs/architecture/data-model.md`
- 规则：`.cursor/rules/supabase.mdc`、`supabase` skill
