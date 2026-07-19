import { z } from "zod";

/**
 * 环境变量校验（zod v4）。按子系统分组，惰性校验（首次使用时才校验），
 * 这样在尚未配置某子系统密钥时不会阻塞其它部分的开发。
 *
 * 缺失/非法时抛出聚合的清晰错误，明确指出缺了哪些变量、去哪里配置。
 * 真实值放 .env.local（已 gitignore）；模板见 .env.example。
 */

function validate<S extends z.ZodType>(
  group: string,
  schema: S,
  source: unknown,
): z.infer<S> {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(
      `[env] ${group} 环境变量校验失败：\n${issues}\n` +
        `请在 .env.local 中按 .env.example 填写对应变量。`,
    );
  }
  return parsed.data;
}

const nonEmpty = (name: string) =>
  z
    .string({ error: `${name} 缺失或类型错误` })
    .min(1, { error: `${name} 不能为空` });

/** 惰性 + 记忆化：每组只在首次访问时校验一次 */
function memo<T>(fn: () => T): () => T {
  let cached: T | undefined;
  let done = false;
  return () => {
    if (!done) {
      cached = fn();
      done = true;
    }
    return cached as T;
  };
}

/** Supabase（认证 / 数据库 / 存储）。SERVICE_ROLE 仅服务端使用。 */
export const getSupabaseEnv = memo(() =>
  validate(
    "Supabase",
    z.object({
      NEXT_PUBLIC_SUPABASE_URL: z.url({
        error: "NEXT_PUBLIC_SUPABASE_URL 必须是合法 URL（且不能为空）",
      }),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: nonEmpty("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      SUPABASE_SERVICE_ROLE_KEY: nonEmpty("SUPABASE_SERVICE_ROLE_KEY"),
    }),
    {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  ),
);

/** LLM 层。按 LLM_PROVIDER 选择默认 provider，并要求对应的 key。 */
export const getLLMEnv = memo(() => {
  const base = validate(
    "LLM",
    z.object({
      LLM_PROVIDER: z
        .enum(["openai", "anthropic", "qwen"], {
          error: "LLM_PROVIDER 必须是 openai、anthropic 或 qwen",
        })
        .default("openai"),
    }),
    { LLM_PROVIDER: process.env.LLM_PROVIDER },
  );

  if (base.LLM_PROVIDER === "openai") {
    const { OPENAI_API_KEY } = validate(
      "LLM(OpenAI)",
      z.object({ OPENAI_API_KEY: nonEmpty("OPENAI_API_KEY") }),
      { OPENAI_API_KEY: process.env.OPENAI_API_KEY },
    );
    return { provider: "openai" as const, openaiApiKey: OPENAI_API_KEY };
  }

  if (base.LLM_PROVIDER === "qwen") {
    const { DASHSCOPE_API_KEY } = validate(
      "LLM(Qwen)",
      z.object({
        DASHSCOPE_API_KEY: nonEmpty("DASHSCOPE_API_KEY（或 QWEN_API_KEY）"),
      }),
      // 兼容两种命名：官方 DASHSCOPE_API_KEY 优先，回退 QWEN_API_KEY。
      {
        DASHSCOPE_API_KEY:
          process.env.DASHSCOPE_API_KEY ?? process.env.QWEN_API_KEY,
      },
    );
    return { provider: "qwen" as const, qwenApiKey: DASHSCOPE_API_KEY };
  }

  const { ANTHROPIC_API_KEY } = validate(
    "LLM(Anthropic)",
    z.object({ ANTHROPIC_API_KEY: nonEmpty("ANTHROPIC_API_KEY") }),
    { ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY },
  );
  return { provider: "anthropic" as const, anthropicApiKey: ANTHROPIC_API_KEY };
});

/** RAG（Pinecone）。 */
export const getPineconeEnv = memo(() =>
  validate(
    "Pinecone",
    z.object({
      PINECONE_API_KEY: nonEmpty("PINECONE_API_KEY"),
      PINECONE_INDEX: nonEmpty("PINECONE_INDEX"),
    }),
    {
      PINECONE_API_KEY: process.env.PINECONE_API_KEY,
      PINECONE_INDEX: process.env.PINECONE_INDEX,
    },
  ),
);

const DASHSCOPE_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";

/**
 * Embedding（RAG 向量化）。统一走 OpenAI 兼容接口，仅切换 baseURL / 模型 / key。
 *
 * provider 选择：EMBEDDING_PROVIDER 显式指定；未设时若 LLM_PROVIDER=qwen 则默认
 * dashscope，否则 openai。这样「全程 Qwen」无需额外配置。
 * - openai：key=OPENAI_API_KEY，模型默认 text-embedding-3-small
 * - dashscope/qwen：key=DASHSCOPE_API_KEY（回退 QWEN_API_KEY），DashScope 兼容端点，
 *   模型默认 text-embedding-v4（配合 EMBEDDING_DIMENSION=1536）
 * 输出维度统一为 EMBEDDING_DIMENSION，须与 Pinecone 索引维度一致。
 */
export const getEmbeddingEnv = memo(() => {
  const provider = (
    process.env.EMBEDDING_PROVIDER ??
    (process.env.LLM_PROVIDER === "qwen" ? "dashscope" : "openai")
  ).toLowerCase();

  if (provider === "dashscope" || provider === "qwen") {
    const { DASHSCOPE_API_KEY } = validate(
      "Embedding(Qwen)",
      z.object({
        DASHSCOPE_API_KEY: nonEmpty("DASHSCOPE_API_KEY（或 QWEN_API_KEY）"),
      }),
      {
        DASHSCOPE_API_KEY:
          process.env.DASHSCOPE_API_KEY ?? process.env.QWEN_API_KEY,
      },
    );
    return {
      apiKey: DASHSCOPE_API_KEY,
      baseURL: process.env.QWEN_BASE_URL ?? DASHSCOPE_BASE_URL,
      model: process.env.EMBEDDING_MODEL ?? "text-embedding-v4",
    };
  }

  const { OPENAI_API_KEY } = validate(
    "Embedding(OpenAI)",
    z.object({ OPENAI_API_KEY: nonEmpty("OPENAI_API_KEY") }),
    { OPENAI_API_KEY: process.env.OPENAI_API_KEY },
  );
  return {
    apiKey: OPENAI_API_KEY,
    baseURL: undefined as string | undefined,
    model: process.env.EMBEDDING_MODEL ?? "text-embedding-3-small",
  };
});

/**
 * 规则-only 降级：跳过 LLM 与 RAG 网络调用，仅跑解析 + 规则 + 模板底稿。
 * 设置 `AUDIT_DEGRADED_MODE=rules_only`（或 `DEMO_RULES_ONLY=1`）。
 */
export function isAuditDegradedMode(): boolean {
  const mode = (process.env.AUDIT_DEGRADED_MODE ?? "").trim().toLowerCase();
  if (mode === "rules_only" || mode === "1" || mode === "true") return true;
  const demo = (process.env.DEMO_RULES_ONLY ?? "").trim().toLowerCase();
  return demo === "1" || demo === "true" || demo === "yes";
}

/** 一次性校验全部子系统（用于部署前自检 / CI / `npm run check:env`）。 */
export function validateAllEnv(): void {
  getSupabaseEnv();
  if (!isAuditDegradedMode()) {
    getLLMEnv();
    getPineconeEnv();
    getEmbeddingEnv();
  }
}
