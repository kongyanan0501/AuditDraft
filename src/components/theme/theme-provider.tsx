"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// 主题系统客户端状态：light / dark / system 三态。
// - system：跟随 prefers-color-scheme，并实时响应系统切换。
// - 持久化到 localStorage，key 与 layout.tsx 的无闪烁脚本保持一致。
// - 切换时优先走 View Transition API（Chromium）做柔和交叉淡出；
//   prefers-reduced-motion 或不支持时直接同步应用。

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "auditdraft-theme";

interface ThemeContextValue {
  /** 用户选择（含 system） */
  theme: Theme;
  /** 实际生效的外观（system 已解析为 light/dark） */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolve(theme: Theme): ResolvedTheme {
  if (theme === "system") return systemPrefersDark() ? "dark" : "light";
  return theme;
}

function applyResolved(resolved: ResolvedTheme): void {
  const el = document.documentElement;
  el.classList.toggle("dark", resolved === "dark");
  el.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // 初始值用 "system"，真实值在 mount 后从 localStorage 读取，避免 SSR/CSR 不一致。
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  useEffect(() => {
    const stored = (localStorage.getItem(THEME_STORAGE_KEY) as Theme | null) ?? "system";
    setThemeState(stored);
    setResolvedTheme(resolve(stored));
  }, []);

  // system 模式下跟随系统外观实时变化。
  useEffect(() => {
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next = mql.matches ? "dark" : "light";
      setResolvedTheme(next);
      applyResolved(next);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    const nextResolved = resolve(next);

    const commit = () => {
      applyResolved(nextResolved);
      setThemeState(next);
      setResolvedTheme(nextResolved);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        /* localStorage 不可用时静默降级 */
      }
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startViewTransition = (
      document as Document & {
        startViewTransition?: (cb: () => void) => void;
      }
    ).startViewTransition;

    if (startViewTransition && !reduce) {
      startViewTransition.call(document, commit);
    } else {
      commit();
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within <ThemeProvider>");
  }
  return ctx;
}
