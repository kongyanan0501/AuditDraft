-- AuditDraft AI · 阶段1 业务表 + RLS
-- 设计依据：docs/architecture/data-model.md、ARCHITECTURE.md §6
--
-- 安全约定（见 supabase skill 安全清单）：
--   * 所有表启用 RLS；策略用 `TO authenticated` + 归属断言。
--   * UPDATE 策略同时给 USING 与 WITH CHECK，避免越权改 user_id。
--   * 子表（reports / raw_data）经 job_id → audit_jobs.user_id 间接归属。

-- ── audit_jobs ────────────────────────────────────────────
create table if not exists public.audit_jobs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  filename     text not null,
  storage_path text,
  status       text not null default 'pending'
                 check (status in ('pending', 'running', 'done', 'failed')),
  created_at   timestamptz not null default now()
);

create index if not exists audit_jobs_user_id_idx on public.audit_jobs (user_id);
create index if not exists audit_jobs_created_at_idx on public.audit_jobs (created_at desc);

alter table public.audit_jobs enable row level security;

drop policy if exists "audit_jobs_select_own" on public.audit_jobs;
create policy "audit_jobs_select_own" on public.audit_jobs
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "audit_jobs_insert_own" on public.audit_jobs;
create policy "audit_jobs_insert_own" on public.audit_jobs
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "audit_jobs_update_own" on public.audit_jobs;
create policy "audit_jobs_update_own" on public.audit_jobs
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "audit_jobs_delete_own" on public.audit_jobs;
create policy "audit_jobs_delete_own" on public.audit_jobs
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ── audit_reports ─────────────────────────────────────────
create table if not exists public.audit_reports (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid not null references public.audit_jobs (id) on delete cascade,
  report_json jsonb not null,
  risk_level  text check (risk_level in ('low', 'medium', 'high')),
  created_at  timestamptz not null default now()
);

create index if not exists audit_reports_job_id_idx on public.audit_reports (job_id);

alter table public.audit_reports enable row level security;

-- 归属判断：报告所属 job 必须属于当前用户。
drop policy if exists "audit_reports_select_own" on public.audit_reports;
create policy "audit_reports_select_own" on public.audit_reports
  for select to authenticated
  using (
    exists (
      select 1 from public.audit_jobs j
      where j.id = audit_reports.job_id
        and j.user_id = (select auth.uid())
    )
  );

drop policy if exists "audit_reports_insert_own" on public.audit_reports;
create policy "audit_reports_insert_own" on public.audit_reports
  for insert to authenticated
  with check (
    exists (
      select 1 from public.audit_jobs j
      where j.id = audit_reports.job_id
        and j.user_id = (select auth.uid())
    )
  );

drop policy if exists "audit_reports_update_own" on public.audit_reports;
create policy "audit_reports_update_own" on public.audit_reports
  for update to authenticated
  using (
    exists (
      select 1 from public.audit_jobs j
      where j.id = audit_reports.job_id
        and j.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.audit_jobs j
      where j.id = audit_reports.job_id
        and j.user_id = (select auth.uid())
    )
  );

-- ── audit_raw_data ────────────────────────────────────────
create table if not exists public.audit_raw_data (
  id     uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.audit_jobs (id) on delete cascade,
  data   jsonb not null
);

create index if not exists audit_raw_data_job_id_idx on public.audit_raw_data (job_id);

alter table public.audit_raw_data enable row level security;

drop policy if exists "audit_raw_data_select_own" on public.audit_raw_data;
create policy "audit_raw_data_select_own" on public.audit_raw_data
  for select to authenticated
  using (
    exists (
      select 1 from public.audit_jobs j
      where j.id = audit_raw_data.job_id
        and j.user_id = (select auth.uid())
    )
  );

drop policy if exists "audit_raw_data_insert_own" on public.audit_raw_data;
create policy "audit_raw_data_insert_own" on public.audit_raw_data
  for insert to authenticated
  with check (
    exists (
      select 1 from public.audit_jobs j
      where j.id = audit_raw_data.job_id
        and j.user_id = (select auth.uid())
    )
  );
