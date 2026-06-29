import { Download } from "lucide-react";

// 一键导出 Word / PDF。导出路由设置 Content-Disposition: attachment，
// 故用原生下载链接即可（无需客户端 JS）。

export function ExportButtons({ jobId }: { jobId: string }) {
  const base = `/api/audit/${jobId}/export`;
  const linkClass =
    "flex h-8 items-center gap-1.5 rounded-md border border-input bg-card px-3 text-xs font-medium transition-colors hover:bg-secondary active:translate-y-px";

  return (
    <div className="flex items-center gap-2">
      <a href={`${base}?format=word`} className={linkClass}>
        <Download className="h-3.5 w-3.5" strokeWidth={2} />
        Word
      </a>
      <a href={`${base}?format=pdf`} className={linkClass}>
        <Download className="h-3.5 w-3.5" strokeWidth={2} />
        PDF
      </a>
    </div>
  );
}
