import "server-only";

import OpenAI from "openai";

import type { LLMGenerateOptions, LLMProvider } from "../types";

/** DashScope OpenAI 兼容端点（默认）。可用 QWEN_BASE_URL 覆盖（如自建网关）。 */
const DEFAULT_QWEN_BASE_URL =
  "https://dashscope.aliyuncs.com/compatible-mode/v1";

/**
 * Qwen（通义千问）provider。仅服务端使用（持有 API key）。
 * Qwen 提供 OpenAI 兼容接口，故复用 OpenAI SDK，仅切换 baseURL。
 * 模型可通过 QWEN_MODEL 覆盖，默认 qwen-plus；端点可通过 QWEN_BASE_URL 覆盖。
 */
export class QwenProvider implements LLMProvider {
  readonly name = "qwen";
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(apiKey: string, model?: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: process.env.QWEN_BASE_URL ?? DEFAULT_QWEN_BASE_URL,
    });
    this.model = model ?? process.env.QWEN_MODEL ?? "qwen-plus";
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
