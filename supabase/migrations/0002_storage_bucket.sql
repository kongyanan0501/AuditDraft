-- AuditDraft AI · 阶段1 私有 Storage bucket（审计原始文件）
-- bucket: audit-uploads（私有）。对象路径约定：{user_id}/{job_id}/{filename}
-- 通过路径首段 = auth.uid() 实现按用户隔离。

insert into storage.buckets (id, name, public)
values ('audit-uploads', 'audit-uploads', false)
on conflict (id) do nothing;

-- 用户只能操作自己目录下（路径首段 = 自己的 uid）的对象。
-- upsert 需要 INSERT + SELECT + UPDATE（见 supabase skill 存储清单）。
drop policy if exists "audit_uploads_select_own" on storage.objects;
create policy "audit_uploads_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'audit-uploads'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "audit_uploads_insert_own" on storage.objects;
create policy "audit_uploads_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'audit-uploads'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "audit_uploads_update_own" on storage.objects;
create policy "audit_uploads_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'audit-uploads'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'audit-uploads'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "audit_uploads_delete_own" on storage.objects;
create policy "audit_uploads_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'audit-uploads'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
