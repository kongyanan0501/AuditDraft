import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "@/lib/env";
import type { Database } from "./types";

/**
 * Service role 客户端：绕过 RLS，仅供服务端可信流程使用
 * （例如 LangGraph 工作流的后台批处理写入）。
 *
 * 安全约束：
 * - `import "server-only"` 确保此模块永远不会被打进客户端 bundle。
 * - 不持久化 Session、不自动刷新 token（这是无状态服务调用）。
 * - 业务的「按用户读取」仍应优先走 server.ts 的 RLS 客户端。
 */
export function createAdminClient() {
  const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } =
    getSupabaseEnv();

  return createSupabaseClient<Database>(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
