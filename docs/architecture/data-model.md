# 数据模型设计

> Supabase（Postgres）表结构、认证与 RAG 知识库结构。
> 对应代码：`src/lib/supabase`。所有表必须启用 RLS 并按 `user_id` 隔离。

## 1. 业务表

```sql
-- 审计任务
audit_jobs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id),
  filename     text,
  storage_path text,             -- Storage 对象路径 {user_id}/{job_id}/{filename}
  status       text,             -- pending | running | done | failed
  error        text,             -- 失败原因（status='failed' 时填充）
  created_at   timestamptz default now()
);

-- 审计报告
audit_reports (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid references audit_jobs(id),
  report_json jsonb,             -- 结构化底稿 + findings
  risk_level  text,              -- low | medium | high
  created_at  timestamptz default now()
);

-- 原始数据
audit_raw_data (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid references audit_jobs(id),
  data        jsonb              -- 解析后的结构化交易数据
);
```

## 2. 认证（Supabase Auth）

- Email + Password 登录
- Session 管理
- 用户数据隔离（RLS：`auth.uid() = user_id`）

```text
User → Next.js API → Supabase Auth → Session
```

核心 API：

```ts
// 登录
supabase.auth.signInWithPassword({ email, password });

// 注册
supabase.auth.signUp({ email, password });
```

## 3. RLS 原则

- 每张含 `user_id` 的表都启用 Row Level Security。
- `audit_reports` / `audit_raw_data` 通过 `job_id → audit_jobs.user_id` 间接归属用户，策略需校验所属关系。
- 服务端批处理（如工作流写入）使用 service role key，仅在服务端使用，绝不暴露给浏览器。

## 4. RAG 知识库（Pinecone，非关系型）

向量库存储审计知识条目，结构见 `ai-system.md` 第 2 节。索引维度与 embedding 模型保持一致；`type` / `risk_level` / `tags` 作为 metadata 便于过滤检索。
