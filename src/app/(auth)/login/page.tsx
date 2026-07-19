import Link from "next/link";

import { ThemeToggle } from "@/components/theme/theme-toggle";

import { signIn } from "../actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string; notice?: string; redirectTo?: string };
}) {
  const error = searchParams?.error;
  const notice = searchParams?.notice;
  const redirectTo = searchParams?.redirectTo ?? "/dashboard";

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center px-6 py-16">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-8 space-y-2">
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            AuditDraft AI
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">登录</h1>
          <p className="text-sm text-muted-foreground">
            使用邮箱与密码登录你的审计工作台。
          </p>
        </div>

        {notice ? (
          <p className="mb-4 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground">
            {notice}
          </p>
        ) : null}
        {error ? (
          <p className="mb-4 rounded-md border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#ef4444]">
            {error}
          </p>
        ) : null}

        <form action={signIn} className="space-y-4">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              邮箱
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none ring-ring focus-visible:ring-2"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              密码
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none ring-ring focus-visible:ring-2"
              placeholder="至少 6 位"
            />
          </div>
          <button
            type="submit"
            className="h-10 w-full rounded-md bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            登录
          </button>
        </form>

        <p className="mt-6 text-sm text-muted-foreground">
          还没有账号？{" "}
          <Link href="/register" className="font-medium text-foreground underline">
            注册
          </Link>
        </p>
      </div>
    </main>
  );
}
