-- 一键修复：把线上遗留的 audit_reports(task_id, content)
-- 重建为应用所需的 job_id / report_json / risk_level。
--
-- 用法：Supabase Dashboard → SQL Editor → 粘贴全文 → Run
-- 项目：https://supabase.com/dashboard/project/bptjpymuctvcuxeemuro/sql/new

drop table if exists public.audit_reports cascade;

create table public.audit_reports (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid not null references public.audit_jobs (id) on delete cascade,
  report_json jsonb not null,
  risk_level  text check (risk_level in ('low', 'medium', 'high')),
  created_at  timestamptz not null default now()
);

create index if not exists audit_reports_job_id_idx on public.audit_reports (job_id);

alter table public.audit_reports enable row level security;

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

grant select, insert, update, delete on public.audit_reports to authenticated;
grant all on public.audit_reports to service_role;

-- 校验：应看到 job_id / report_json / risk_level
select column_name
from information_schema.columns
where table_schema = 'public' and table_name = 'audit_reports'
order by ordinal_position;
