"use client";

import {
  BookOpen,
  FileText,
  FlaskConical,
  LayoutDashboard,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "任务 Jobs", icon: LayoutDashboard },
  { href: "/reports", label: "报告 Reports", icon: FileText },
  { href: "/eval", label: "可信证据 Eval", icon: FlaskConical },
  { href: "/rag", label: "知识库 RAG", icon: BookOpen },
  { href: "/account", label: "我的 Account", icon: UserRound },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname.startsWith("/jobs");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({ variant = "sidebar" }: { variant?: "sidebar" | "top" }) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        variant === "sidebar"
          ? "flex flex-col gap-1"
          : "flex gap-1 overflow-x-auto",
      )}
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
