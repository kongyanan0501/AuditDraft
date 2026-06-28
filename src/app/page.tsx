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
      <p className="text-sm text-muted-foreground">
        项目处于架构初始化阶段，开发进度见 <code>todo.md</code>。
      </p>
    </main>
  );
}
