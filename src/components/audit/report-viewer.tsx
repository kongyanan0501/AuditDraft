import { ChevronRight, FileText } from "lucide-react";

import { cn } from "@/lib/utils";

// Audit Report Viewer：Notion 风格可折叠底稿。把 workpaper(Markdown) 按标题切分为
// 可折叠 section（原生 <details>，零 JS），正文做轻量 Markdown 渲染（标题/列表/加粗/段落）。
// 仅做展示，不做业务推理。

const HEADING_RE = /^(#{1,6})\s+(.*)$/;
const ORDINAL_RE = /^([一二三四五六七八九十百]+、.+)$/;
const BULLET_RE = /^[-*•]\s+(.*)$/;
const ORDERED_RE = /^\d+[.、)]\s+(.*)$/;

interface Section {
  title: string | null;
  lines: string[];
}

function splitSections(markdown: string): Section[] {
  const sections: Section[] = [];
  let current: Section = { title: null, lines: [] };

  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.replace(/\s+$/, "");
    const heading = HEADING_RE.exec(line);
    const ordinal = ORDINAL_RE.exec(line);

    if (heading || ordinal) {
      if (current.title !== null || current.lines.some((l) => l.trim())) {
        sections.push(current);
      }
      current = { title: heading ? heading[2] : ordinal![1], lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  if (current.title !== null || current.lines.some((l) => l.trim())) {
    sections.push(current);
  }
  return sections;
}

/** 行内加粗：**text** → <strong>。 */
function renderInline(text: string, keyBase: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${keyBase}-${i}`}>{part.slice(2, -2)}</strong>;
    }
    return <span key={`${keyBase}-${i}`}>{part}</span>;
  });
}

/** 渲染一段正文：分组为 列表 / 段落。 */
function renderBody(lines: string[]): React.ReactNode[] {
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  let para: string[] = [];

  const flushList = () => {
    if (list.length === 0) return;
    const items = [...list];
    blocks.push(
      <ul
        key={`ul-${blocks.length}`}
        className="my-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground"
      >
        {items.map((item, i) => (
          <li key={i}>{renderInline(item, `li-${blocks.length}-${i}`)}</li>
        ))}
      </ul>,
    );
    list = [];
  };
  const flushPara = () => {
    if (para.length === 0) return;
    const text = para.join(" ");
    blocks.push(
      <p
        key={`p-${blocks.length}`}
        className="my-2 text-sm leading-relaxed text-muted-foreground"
      >
        {renderInline(text, `p-${blocks.length}`)}
      </p>,
    );
    para = [];
  };

  for (const line of lines) {
    if (!line.trim()) {
      flushList();
      flushPara();
      continue;
    }
    const bullet = BULLET_RE.exec(line) ?? ORDERED_RE.exec(line);
    if (bullet) {
      flushPara();
      list.push(bullet[1]);
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushList();
  flushPara();
  return blocks;
}

export function ReportViewer({ workpaper }: { workpaper: string }) {
  const trimmed = workpaper?.trim() ?? "";
  if (!trimmed) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-card px-4 py-10 text-center">
        <FileText className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
        <p className="text-sm text-muted-foreground">暂无底稿正文</p>
      </div>
    );
  }

  const sections = splitSections(trimmed);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {sections.map((section, i) =>
        section.title === null ? (
          <div key={i} className="px-5 py-4">
            {renderBody(section.lines)}
          </div>
        ) : (
          <details
            key={i}
            open
            className={cn("group", i > 0 && "border-t border-border")}
          >
            <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors hover:bg-secondary">
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
              {section.title}
            </summary>
            <div className="border-t border-border px-5 py-3">
              {renderBody(section.lines)}
            </div>
          </details>
        ),
      )}
    </div>
  );
}
