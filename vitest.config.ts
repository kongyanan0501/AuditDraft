import path from "node:path";

import { defineConfig } from "vitest/config";

// 单测配置。解析 `@/` 别名到 src；测试位于 tests/。
// 规则引擎为纯函数、图用 mock LLM，均不触发任何网络调用。
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
