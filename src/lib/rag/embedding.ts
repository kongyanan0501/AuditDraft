import "server-only";

import OpenAI from "openai";

import { getEmbeddingEnv } from "@/lib/env";

import { EMBEDDING_BATCH_SIZE, EMBEDDING_DIMENSION, type Embedder } from "./types";

/**
 * OpenAI 兼容 embedder（OpenAI / DashScope 均走同一 SDK，仅切 baseURL/模型）。
 * 配置来源见 env.ts 的 getEmbeddingEnv；输出维度统一为 EMBEDDING_DIMENSION，
 * 须与 Pinecone 索引维度一致。
 */
export class OpenAIEmbedder implements Embedder {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor() {
    const { apiKey, baseURL, model } = getEmbeddingEnv();
    this.client = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
    this.model = model;
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    // 分批：部分兼容端点（DashScope）限制每批 ≤10 条。
    const vectors: number[][] = [];
    for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE);
      const response = await this.client.embeddings.create({
        model: this.model,
        input: batch,
        dimensions: EMBEDDING_DIMENSION,
      });
      vectors.push(...response.data.map((d) => d.embedding));
    }
    return vectors;
  }
}
