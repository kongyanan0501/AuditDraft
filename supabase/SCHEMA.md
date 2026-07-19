# Supabase 数据库表结构（Schema 快照）

> 本文件是**数据库当前结构的权威快照**，反映 SQL Editor / migrations 已实际执行到线上的状态。
> 迁移脚本见 `supabase/migrations/`；TypeScript 行类型见 `src/lib/supabase/types.ts`；设计说明见 `docs/architecture/data-model.md`。
>
> **维护约定**：每次更新数据库（新增/修改表、列、索引、RLS 策略、Storage bucket 等）后，必须同步更新本文件。详见 `.cursor/rules/supabase.mdc`。

- 最近同步迁移：`0003_job_error.sql`
- 最近更新时间：2026-07-05

---

## 概览

| 对象 | 类型 | 说明 |
| --- | --- | --- |
| `public.audit_jobs` | 表 | 审计任务（每次上传一个文件 = 一个 job） |
| `public.audit_reports` | 表 | 审计报告（一个 job 的分析结果，JSON） |
| `public.audit_raw_data` | 表 | 解析后的原始行数据（JSON） |
| `storage.audit-uploads` | Storage bucket | 私有桶，存审计原始文件（Excel/CSV） |

所有业务表启用 RLS，按 `user_id` 隔离；子表通过 `job_id → audit_jobs.user_id` 间接归属。

---

## public.audit_jobs

审计任务主表。

| 列 | 类型 | 约束 / 默认 | 说明 |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | 主键 |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users(id)` ON DELETE CASCADE | 归属用户 |
| `filename` | `text` | NOT NULL | 上传文件名 |
| `storage_path` | `text` | NULL | Storage 对象路径 `{user_id}/{job_id}/{filename}` |
| `status` | `text` | NOT NULL, default `'pending'`, CHECK ∈ (`pending`,`running`,`done`,`failed`) | 任务状态 |
| `error` | `text` | NULL | 失败原因（`status='failed'` 时填充，供前端展示） |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | 创建时间 |

**索引**
- `audit_jobs_user_id_idx` on (`user_id`)
- `audit_jobs_created_at_idx` on (`created_at` DESC)

**RLS**（`TO authenticated`，`auth.uid() = user_id`）
- `audit_jobs_select_own` (SELECT)
- `audit_jobs_insert_own` (INSERT，WITH CHECK)
- `audit_jobs_update_own` (UPDATE，USING + WITH CHECK)
- `audit_jobs_delete_own` (DELETE)

---

## public.audit_reports

审计报告表，一个 job 对应报告结果。

| 列 | 类型 | 约束 / 默认 | 说明 |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | 主键 |
| `job_id` | `uuid` | NOT NULL, FK → `audit_jobs(id)` ON DELETE CASCADE | 所属任务 |
| `report_json` | `jsonb` | NOT NULL | 报告结构（`AuditReport`） |
| `risk_level` | `text` | NULL, CHECK ∈ (`low`,`medium`,`high`) | 整体风险等级 |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | 创建时间 |

**索引**
- `audit_reports_job_id_idx` on (`job_id`)

**RLS**（`TO authenticated`，通过 `job_id → audit_jobs.user_id` 校验归属）
- `audit_reports_select_own` (SELECT)
- `audit_reports_insert_own` (INSERT，WITH CHECK)
- `audit_reports_update_own` (UPDATE，USING + WITH CHECK)

---

## public.audit_raw_data

解析后的原始行数据表。

| 列 | 类型 | 约束 / 默认 | 说明 |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | 主键 |
| `job_id` | `uuid` | NOT NULL, FK → `audit_jobs(id)` ON DELETE CASCADE | 所属任务 |
| `data` | `jsonb` | NOT NULL | 解析后的行数据 |

**索引**
- `audit_raw_data_job_id_idx` on (`job_id`)

**RLS**（`TO authenticated`，通过 `job_id → audit_jobs.user_id` 校验归属）
- `audit_raw_data_select_own` (SELECT)
- `audit_raw_data_insert_own` (INSERT，WITH CHECK)

---

## storage bucket：audit-uploads

私有桶，存审计原始文件（Excel/CSV）。对象路径约定 `{user_id}/{job_id}/{filename}`。

- `id` / `name`：`audit-uploads`
- `public`：`false`

**Storage RLS**（`storage.objects`，`TO authenticated`，路径首段 `(storage.foldername(name))[1] = auth.uid()`）
- `audit_uploads_select_own` (SELECT)
- `audit_uploads_insert_own` (INSERT，WITH CHECK)
- `audit_uploads_update_own` (UPDATE，USING + WITH CHECK)
- `audit_uploads_delete_own` (DELETE)
