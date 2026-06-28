import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { getSupabaseEnv } from "@/lib/env";
import type { Database } from "./types";

/**
 * 服务端 Supabase 客户端（RSC / Server Action / Route Handler）。
 * 绑定到当前请求的 cookies，因此后续查询都受 RLS（auth.uid()）约束。
 *
 * 注意：在 React Server Component 中调用 setAll 会抛错（无法写 cookie），
 * 这是预期行为——Session 刷新由 middleware 负责，这里 try/catch 吞掉即可。
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } =
    getSupabaseEnv();

  return createServerClient<Database>(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // 在 Server Component 中无法写 cookie；交给 middleware 刷新 Session。
          }
        },
      },
    },
  );
}
