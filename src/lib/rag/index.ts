// RAG 检索层入口。对外只暴露 retrieve()：Query → Embedding → Pinecone → Top-K。
// 向量库与 embedding 实现可替换，契约不变（ARCHITECTURE.md §7）。

import { OpenAIEmbedder } from "./embedding";
import { PineconeStore } from "./pinecone";
import { DEFAULT_TOP_K, type RagDeps } from "./types";

export type {
  Embedder,
  KnowledgeItem,
  KnowledgeType,
  RagDeps,
  VectorStore,
} from "./types";
export { EMBEDDING_DIMENSION, DEFAULT_TOP_K } from "./types";
export { OpenAIEmbedder } from "./embedding";
export { PineconeStore } from "./pinecone";

/**
 * 用注入的依赖构造 retrieve 函数（便于测试 / 替换向量库）。
 * 返回值为知识条目的 content 文本数组，契约：retrieve(query) => Promise<string[]>。
 */
export function createRetriever(deps: RagDeps) {
  return async function retrieve(
    query: string,
    topK: number = DEFAULT_TOP_K,
  ): Promise<string[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];
    const [vector] = await deps.embedder.embed([trimmed]);
    if (!vector) return [];
    const items = await deps.store.query(vector, topK);
    return items.map((item) => item.content);
  };
}

let cached: ReturnType<typeof createRetriever> | undefined;

/**
 * 默认 retrieve：用真实 OpenAI embedding + Pinecone。
 * 调用方（graph 节点）只依赖该函数签名，不感知向量库实现。
 */
export function retrieve(query: string, topK?: number): Promise<string[]> {
  if (!cached) {
    cached = createRetriever({
      embedder: new OpenAIEmbedder(),
      store: new PineconeStore(),
    });
  }
  return cached(query, topK);
}
