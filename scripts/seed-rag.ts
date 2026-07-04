import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

import { getEmbeddingEnv, getPineconeEnv } from "../src/lib/env.ts";
import { SEED_KNOWLEDGE } from "../src/lib/rag/knowledge.ts";
import {
  EMBEDDING_BATCH_SIZE,
  EMBEDDING_DIMENSION,
} from "../src/lib/rag/types.ts";

// RAG 知识库灌入脚本：建索引（若缺失）→ 向量化种子知识 → upsert 到 Pinecone。
// 用法：npm run seed:rag （自动加载 .env.local）。
// 需要：OPENAI_API_KEY、PINECONE_API_KEY、PINECONE_INDEX。

async function main(): Promise<void> {
  const { apiKey, baseURL, model: embeddingModel } = getEmbeddingEnv();
  const { PINECONE_API_KEY, PINECONE_INDEX } = getPineconeEnv();

  const cloud = process.env.PINECONE_CLOUD ?? "aws";
  const region = process.env.PINECONE_REGION ?? "us-east-1";

  const pc = new Pinecone({ apiKey: PINECONE_API_KEY });

  const indexes = await pc.listIndexes();
  const exists = indexes.indexes?.some((i) => i.name === PINECONE_INDEX);
  if (!exists) {
    console.log(`[seed-rag] 索引 ${PINECONE_INDEX} 不存在，创建中…`);
    await pc.createIndex({
      name: PINECONE_INDEX,
      dimension: EMBEDDING_DIMENSION,
      metric: "cosine",
      spec: { serverless: { cloud: cloud as "aws", region } },
      waitUntilReady: true,
    });
    console.log(`[seed-rag] 索引 ${PINECONE_INDEX} 已就绪。`);
  }

  const openai = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
  console.log(`[seed-rag] 向量化 ${SEED_KNOWLEDGE.length} 条知识（${embeddingModel}）…`);
  // 分批：部分兼容端点（DashScope）限制每批 ≤10 条。
  const contents = SEED_KNOWLEDGE.map((k) => k.content);
  const vectors: number[][] = [];
  for (let i = 0; i < contents.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = contents.slice(i, i + EMBEDDING_BATCH_SIZE);
    const embedding = await openai.embeddings.create({
      model: embeddingModel,
      input: batch,
      dimensions: EMBEDDING_DIMENSION,
    });
    vectors.push(...embedding.data.map((d) => d.embedding));
  }

  const records = SEED_KNOWLEDGE.map((item, i) => ({
    id: item.id,
    values: vectors[i],
    metadata: {
      type: item.type,
      content: item.content,
      ...(item.risk_level ? { risk_level: item.risk_level } : {}),
      ...(item.tags && item.tags.length > 0 ? { tags: item.tags } : {}),
    },
  }));

  await pc.index(PINECONE_INDEX).upsert({ records });
  console.log(`[seed-rag] 已写入 ${records.length} 条知识到 ${PINECONE_INDEX} ✓`);
}

main().catch((err) => {
  console.error("[seed-rag] 失败：", err instanceof Error ? err.message : err);
  process.exit(1);
});
