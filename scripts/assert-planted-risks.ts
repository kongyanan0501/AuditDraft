/**
 * Thin CLI wrapper: runs the planted-risks vitest suite.
 * Usage: npm run assert:planted
 */

import { spawnSync } from "node:child_process";

const result = spawnSync(
  "npx",
  ["vitest", "run", "tests/planted-risks.test.ts"],
  { stdio: "inherit", shell: true },
);

process.exit(result.status ?? 1);
