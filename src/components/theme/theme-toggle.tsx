"use client";

import { Moon, Sun, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { useTheme, type ResolvedTheme } from "./theme-provider";

// 浅色 / 深色 双态切换控件。以实际生效外观（resolvedTheme）作为激活态，
// 点击即写入明确的 light/dark。单一 accent（brand）用于激活态描边，其余中性。

const OPTIONS: { value: ResolvedTheme; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "浅色", icon: Sun },
  { value: "dark", label: "深色", icon: Moon },
];

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="主题外观"
      className="inline-flex items-center gap-0.5 rounded-full border border-border bg-secondary/60 p-0.5"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = resolvedTheme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
              "active:scale-[0.96]",
              active
                ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
          </button>
        );
      })}
    </div>
  );
}
