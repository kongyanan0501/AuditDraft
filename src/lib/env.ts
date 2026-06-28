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
        .enum(["openai", "anthropic"], {
          error: "LLM_PROVIDER 必须是 openai 或 anthropic",
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

/** 一次性校验全部子系统（用于部署前自检 / CI / `npm run check:env`）。 */
export function validateAllEnv(): void {
  getSupabaseEnv();
  getLLMEnv();
  getPineconeEnv();
}
