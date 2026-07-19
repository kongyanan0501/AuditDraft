import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { ThemeProvider, THEME_STORAGE_KEY } from "@/components/theme/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AuditDraft AI",
  description: "智能审计底稿生成 + 风险识别 + 可解释审计系统",
};

// 无闪烁脚本：在 React 注水前、首帧绘制前，根据 localStorage / 系统偏好
// 设置 <html> 的 .dark class 与 color-scheme，避免深色模式下的白屏闪烁（FOUC）。
const themeInitScript = `(function(){try{var k=${JSON.stringify(
  THEME_STORAGE_KEY,
)};var t=localStorage.getItem(k);var sys=window.matchMedia("(prefers-color-scheme: dark)").matches;var dark=t==="dark"||((!t||t==="system")&&sys);var el=document.documentElement;el.classList.toggle("dark",dark);el.style.colorScheme=dark?"dark":"light";}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
