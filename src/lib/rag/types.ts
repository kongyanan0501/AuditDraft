// RAG 知识条目与依赖契约。对外只暴露 retrieve()，向量库实现细节内聚于本模块。
// 设计依据：docs/architecture/ai-system.md §2、§8。

export type KnowledgeType =
  | "audit_standard" // 审计准则
  | "risk_rule" // 风险规则
  | "audit_procedure" // 审计程序
  | "fraud_case"; // 舞弊案例

/** 知识条目。metadata（type / risk_level / tags）用于过滤检索。 */
export interface KnowledgeItem {
  id: string;
  type: KnowledgeType;
  content: string;
  risk_level?: "low" | "medium" | "high";
  tags?: string[];
}

/** 文本向量化抽象。更换 embedding 实现不影响 retrieve() 契约。 */
export interface Embedder {
  embed(texts: string[]): Promise<number[][]>;
}

/** 向量库抽象（query / upsert）。更换向量库（Pinecone → 其它）只改实现，不改契约。 */
export interface VectorStore {
  query(vector: number[], topK: number): Promise<KnowledgeItem[]>;
  upsert(items: KnowledgeItem[], vectors: number[][]): Promise<void>;
}

export interface RagDeps {
  embedder: Embedder;
  store: VectorStore;
}

/** OpenAI text-embedding-3-small 的维度，建索引时需一致。 */
export const EMBEDDING_DIMENSION = 1536;
export const DEFAULT_TOP_K = 5;
