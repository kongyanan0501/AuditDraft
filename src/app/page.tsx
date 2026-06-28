import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6 py-16">
      <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
        AI 审计创新大赛
      </span>
      <h1 className="text-4xl font-semibold tracking-tight">AuditDraft AI</h1>
      <p className="text-lg text-muted-foreground">
        智能审计底稿生成 + 风险识别 + 可解释审计系统。 Excel → AI 审计流程 →
        标准审计底稿（30 秒）。
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
      <p className="text-sm text-muted-foreground">
        基础设施（Supabase 认证与数据）已就绪，开发进度见 <code>todo.md</code>。
      </p>
    </main>
  );
}
