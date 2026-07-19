import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { buildDemoSnapshot } from "@/lib/eval/buildDemoSnapshot";

describe("write demo snapshot", () => {
  it("writes samples/demo-snapshots/report_ey_demo.json", () => {
    const snap = buildDemoSnapshot();
    const dir = join(process.cwd(), "samples", "demo-snapshots");
    mkdirSync(dir, { recursive: true });
    const path = join(dir, "report_ey_demo.json");
    writeFileSync(path, JSON.stringify(snap, null, 2) + "\n", "utf8");

    expect(snap.kind).toBe("failover_snapshot");
    expect(snap.report.findings.length).toBeGreaterThan(0);
    expect(snap.report.meta?.degraded).toBe(true);
    // eslint-disable-next-line no-console
    console.log(
      `[generate:snapshot] findings=${snap.report.findings.length} risk=${snap.report.riskLevel} → ${path}`,
    );
  });
});
