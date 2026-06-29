import { BookOpen } from "lucide-react";

import { SEVERITY } from "@/components/audit/severity";
import { SEED_KNOWLEDGE } from "@/lib/rag/knowledge";
import type { KnowledgeType } from "@/lib/rag/types";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<KnowledgeType, string> = {
  audit_standard: "审计准则",
  risk_rule: "风险规则",
  audit_procedure: "审计程序",
  fraud_case: "舞弊案例",
};

const TYPE_ORDER: KnowledgeType[] = [
  "risk_rule",
  "audit_standard",
  "audit_procedure",
  "fraud_case",
];

export default function RagKnowledgePage() {
  const groups = TYPE_ORDER.map((type) => ({
    type,
    items: SEED_KNOWLEDGE.filter((k) => k.type === type),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">审计知识库</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          RAG 检索增强使用的种子知识：审计准则、风险规则、审计程序与舞弊案例。
          审计计划与风险解释会引用这些知识作为标准依据。
        </p>
      </div>

      {groups.map((group) => (
        <section key={group.type}>
          <div className="mb-3 flex items-center gap-2">
            <BookOpen
              className="h-4 w-4 text-muted-foreground"
              strokeWidth={1.75}
            />
            <h2 className="text-sm font-medium">{TYPE_LABEL[group.type]}</h2>
            <span className="text-xs text-muted-foreground">
              ({group.items.length})
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {group.items.map((item) => {
              const sev = item.risk_level ? SEVERITY[item.risk_level] : null;
              return (
                <article
                  key={item.id}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <code className="truncate text-xs text-muted-foreground">
                      {item.id}
                    </code>
                    {sev ? (
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                          sev.surface,
                          sev.text,
                        )}
                      >
                        {sev.label}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.content}
                  </p>
                  {item.tags && item.tags.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
