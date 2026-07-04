import "server-only";

import { getLLMEnv } from "@/lib/env";

import { AnthropicProvider } from "./providers/anthropic";
import { OpenAIProvider } from "./providers/openai";
import { QwenProvider } from "./providers/qwen";
import type { LLMProvider } from "./types";

export type { LLMGenerateOptions, LLMProvider } from "./types";

let cached: LLMProvider | undefined;

/**
 * LLM 工厂：按 LLM_PROVIDER 环境变量选择默认 provider。
 * 调用方只拿到 LLMProvider 接口，不感知具体实现（解耦 / 可替换）。
 */
export function getLLM(): LLMProvider {
  if (cached) return cached;

  const env = getLLMEnv();
  if (env.provider === "anthropic") {
    cached = new AnthropicProvider(env.anthropicApiKey);
  } else if (env.provider === "qwen") {
    cached = new QwenProvider(env.qwenApiKey);
  } else {
    cached = new OpenAIProvider(env.openaiApiKey);
  }

  return cached;
}

/** 测试 / 热切换用：清空已缓存的 provider。 */
export function resetLLM(): void {
  cached = undefined;
}
