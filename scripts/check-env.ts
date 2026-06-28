import { validateAllEnv } from "../src/lib/env.ts";

// 部署前/CI 自检：校验所有子系统的必填环境变量。
// 用法：npm run check:env （自动加载 .env.local，若存在）
try {
  validateAllEnv();
  console.log("[env] 所有环境变量校验通过 ✓");
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
