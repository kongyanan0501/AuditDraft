import "server-only";

import OpenAI from "openai";

import { getEmbeddingEnv } from "@/lib/env";

import type { Embedder } from "./types";

/** OpenAI embedder。模型可通过 EMBEDDING_MODEL 覆盖，默认 text-embedding-3-small。 */
export class OpenAIEmbedder implements Embedder {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(apiKey?: string, model?: string) {
    const key = apiKey ?? getEmbeddingEnv().OPENAI_API_KEY;
    this.client = new OpenAI({ apiKey: key });
    this.model = model ?? process.env.EMBEDDING_MODEL ?? "text-embedding-3-small";
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const response = await this.client.embeddings.create({
      model: this.model,
      input: texts,
    });
    return response.data.map((d) => d.embedding);
  }
}
