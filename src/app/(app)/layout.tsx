import { ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";

import { SidebarNav } from "@/components/audit/sidebar-nav";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { requireUser } from "@/lib/supabase/repository";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="h-4 w-4" strokeWidth={2} />
          </span>
          <span className="text-sm font-semibold tracking-tight">
            AuditDraft AI
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {user.email}
          </span>
          <ThemeToggle />
          <Link
            href="/account"
            className="flex h-8 items-center gap-1.5 rounded-md border border-input bg-card px-2.5 text-xs font-medium transition-colors hover:bg-secondary"
          >
            <UserRound className="h-3.5 w-3.5" strokeWidth={2} />
            我的
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px]">
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-56 shrink-0 border-r border-border p-3 md:block">
          <SidebarNav />
        </aside>

        <div className="min-w-0 flex-1">
          <div className="border-b border-border p-3 md:hidden">
            <SidebarNav variant="top" />
          </div>
          <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
