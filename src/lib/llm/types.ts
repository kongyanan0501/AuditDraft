// LLM 抽象层契约。业务层（graph / api）只依赖这些类型，永远不直接 import
// OpenAI / Anthropic SDK。新增模型 = 新增一个实现 LLMProvider 的 provider。
// 设计依据：ARCHITECTURE.md §7、docs/architecture/ai-system.md §1。

export interface LLMGenerateOptions {
  /** 系统指令（角色 / 输出约束）。 */
  system?: string;
  /** 采样温度；审计场景偏低以求稳定。 */
  temperature?: number;
  /** 输出 token 上限。 */
  maxTokens?: number;
}

/**
 * 统一的大模型调用接口。
 * 契约最小化为 `generate(prompt)`，附带可选生成参数；
 * 任何 provider（OpenAI / Anthropic / 本地）都实现同一接口，调用方可无感替换。
 */
export interface LLMProvider {
  /** provider 标识（用于日志 / 调试），如 "openai" | "anthropic" | "mock"。 */
  readonly name: string;
  generate(prompt: string, options?: LLMGenerateOptions): Promise<string>;
}
