import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import type { LLMGenerateOptions, LLMProvider } from "../types";

/**
 * Anthropic (Claude) provider。仅服务端使用（持有 API key）。
 * 模型可通过 ANTHROPIC_MODEL 覆盖，默认 claude-3-5-sonnet-latest。
 */
export class AnthropicProvider implements LLMProvider {
  readonly name = "anthropic";
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(apiKey: string, model?: string) {
    this.client = new Anthropic({ apiKey });
    this.model =
      model ?? process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest";
  }

  async generate(
    prompt: string,
    options: LLMGenerateOptions = {},
  ): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.2,
      ...(options.system ? { system: options.system } : {}),
      messages: [{ role: "user", content: prompt }],
    });

    return response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");
  }
}
