import "server-only";

import OpenAI from "openai";

import type { LLMGenerateOptions, LLMProvider } from "../types";

/**
 * OpenAI provider。仅服务端使用（持有 API key）。
 * 模型可通过 OPENAI_MODEL 覆盖，默认 gpt-4.1-mini。
 */
export class OpenAIProvider implements LLMProvider {
  readonly name = "openai";
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(apiKey: string, model?: string) {
    this.client = new OpenAI({ apiKey });
    this.model = model ?? process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  }

  async generate(
    prompt: string,
    options: LLMGenerateOptions = {},
  ): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens,
      messages: [
        ...(options.system
          ? [{ role: "system" as const, content: options.system }]
          : []),
        { role: "user" as const, content: prompt },
      ],
    });

    return response.choices[0]?.message?.content ?? "";
  }
}
