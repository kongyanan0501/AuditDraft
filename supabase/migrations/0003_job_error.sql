-- AuditDraft AI · 阶段3 任务错误信息列
-- 工作流为后台异步执行，失败原因需落库以便前端展示「可读错误」。
-- 设计依据：todo.md 阶段3「异常输入 → 任务 failed 且前端有可读错误」。

alter table public.audit_jobs
  add column if not exists error text;
