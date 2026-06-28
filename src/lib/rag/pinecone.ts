import "server-only";

import {
  Pinecone,
  type RecordMetadata,
} from "@pinecone-database/pinecone";

import { getPineconeEnv } from "@/lib/env";

import type {
  KnowledgeItem,
  KnowledgeType,
  VectorStore,
} from "./types";

/** Pinecone 实现的向量库。把 KnowledgeItem 的 metadata 内聚在本模块的存取逻辑里。 */
export class PineconeStore implements VectorStore {
  private readonly client: Pinecone;
  private readonly indexName: string;

  constructor(apiKey?: string, indexName?: string) {
    const env = getPineconeEnv();
    this.client = new Pinecone({ apiKey: apiKey ?? env.PINECONE_API_KEY });
    this.indexName = indexName ?? env.PINECONE_INDEX;
  }

  private index() {
    return this.client.index(this.indexName);
  }

  async query(vector: number[], topK: number): Promise<KnowledgeItem[]> {
    const result = await this.index().query({
      vector,
      topK,
      includeMetadata: true,
    });

    return (result.matches ?? [])
      .map((match) => toKnowledgeItem(match.id, match.metadata))
      .filter((item): item is KnowledgeItem => item !== null);
  }

  async upsert(items: KnowledgeItem[], vectors: number[][]): Promise<void> {
    const records = items.map((item, i) => ({
      id: item.id,
      values: vectors[i],
      metadata: toMetadata(item),
    }));
    await this.index().upsert({ records });
  }
}

function toMetadata(item: KnowledgeItem): RecordMetadata {
  const meta: RecordMetadata = { type: item.type, content: item.content };
  if (item.risk_level) meta.risk_level = item.risk_level;
  if (item.tags && item.tags.length > 0) meta.tags = item.tags;
  return meta;
}

function toKnowledgeItem(
  id: string,
  metadata: RecordMetadata | undefined,
): KnowledgeItem | null {
  if (!metadata || typeof metadata.content !== "string") return null;
  return {
    id,
    type: (metadata.type as KnowledgeType) ?? "risk_rule",
    content: metadata.content,
    risk_level: metadata.risk_level as KnowledgeItem["risk_level"],
    tags: Array.isArray(metadata.tags)
      ? (metadata.tags as string[])
      : undefined,
  };
}
