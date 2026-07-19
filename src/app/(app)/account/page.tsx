import { LogOut, Mail, ShieldCheck } from "lucide-react";

import { signOut } from "@/app/(auth)/actions";
import { getJobs, requireUser } from "@/lib/supabase/repository";

export const dynamic = "force-dynamic";

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("zh-CN", { hour12: false });
}

export default async function AccountPage() {
  const [user, jobs] = await Promise.all([requireUser(), getJobs()]);

  const email = user.email ?? "未知邮箱";
  const initial = email.charAt(0).toUpperCase();

  const stats = [
    { label: "总任务", value: jobs.length },
    { label: "已完成报告", value: jobs.filter((j) => j.status === "done").length },
    { label: "失败任务", value: jobs.filter((j) => j.status === "failed").length },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">我的</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          账户信息与使用概览，可在此登出当前会话。
        </p>
      </div>

      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex items-center gap-4 border-b border-border p-5">
          <span
            aria-hidden
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-semibold text-brand-foreground"
          >
            {initial}
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
              <span className="truncate">{email}</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">已登录</p>
          </div>
        </div>

        <dl className="divide-y divide-border text-sm">
          <div className="flex items-center justify-between gap-4 px-5 py-3">
            <dt className="text-muted-foreground">用户 ID</dt>
            <dd className="truncate font-mono text-xs text-muted-foreground">
              {user.id}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 px-5 py-3">
            <dt className="text-muted-foreground">注册时间</dt>
            <dd className="text-foreground">{formatDate(user.created_at)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 px-5 py-3">
            <dt className="text-muted-foreground">上次登录</dt>
            <dd className="text-foreground">{formatDate(user.last_sign_in_at)}</dd>
          </div>
        </dl>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium">使用概览</h2>
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-border bg-border">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-card px-4 py-4">
              <p className="font-mono text-2xl font-semibold tracking-tight">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck
            className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
            strokeWidth={1.75}
          />
          <div className="flex-1">
            <h2 className="text-sm font-medium">账户操作</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              登出后将结束当前会话，需要重新登录才能访问工作台。
            </p>
          </div>
        </div>
        <form action={signOut} className="mt-4">
          <button
            type="submit"
            className="flex h-9 items-center gap-2 rounded-md border border-risk-high/30 bg-risk-high/10 px-4 text-sm font-medium text-risk-high transition-colors hover:bg-risk-high/20 active:scale-[0.98]"
          >
            <LogOut className="h-4 w-4" strokeWidth={2} />
            退出
          </button>
        </form>
      </section>
    </div>
  );
}
