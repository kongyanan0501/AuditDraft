import Link from "next/link";

import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function Home() {
  return (
    <div className="relative min-h-[100dvh]">
      <div className="absolute right-6 top-6 z-10">
        <ThemeToggle />
      </div>
      <main className="mx-auto flex min-h-[100dvh] max-w-3xl flex-col justify-center gap-6 px-6 py-16">
      <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
        智能审计工作台
      </span>
      <h1 className="text-4xl font-semibold tracking-tight">AuditDraft AI</h1>
      <p className="text-lg text-muted-foreground">
        费用循环风险识别、可解释发现与审计底稿起草辅助。规则引擎保证可复现结论，大模型辅助成文，输出须经项目组复核。
      </p>
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="rounded border border-border px-2 py-1">Next.js 14</span>
        <span className="rounded border border-border px-2 py-1">Supabase</span>
        <span className="rounded border border-border px-2 py-1">LangGraph</span>
        <span className="rounded border border-border px-2 py-1">RAG · Pinecone</span>
      </div>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="h-10 rounded-md bg-primary px-5 text-sm font-medium leading-10 text-primary-foreground transition-opacity hover:opacity-90"
        >
          登录
        </Link>
        <Link
          href="/register"
          className="h-10 rounded-md border border-input bg-card px-5 text-sm font-medium leading-10 transition-colors hover:bg-secondary"
        >
          注册
        </Link>
      </div>
      </main>
    </div>
  );
}
