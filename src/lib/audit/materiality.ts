/** Planning / performance materiality defaults (demo-tunable via env). */

export type MaterialityImpact = "trivial" | "below_pm" | "above_pm";

export type MaterialityConfig = {
  planningMateriality: number;
  performanceMateriality: number;
  trivialThreshold: number;
};

export const RULESET_VERSION = "rules-v1";

export function getMaterialityConfig(): MaterialityConfig {
  const planning = Number(process.env.MATERIALITY_PLANNING ?? 500_000);
  const pm = Number(
    process.env.MATERIALITY_PERFORMANCE ?? Math.round(planning * 0.75),
  );
  const trivial = Number(
    process.env.MATERIALITY_TRIVIAL ?? Math.round(planning * 0.05),
  );
  return {
    planningMateriality: Number.isFinite(planning) ? planning : 500_000,
    performanceMateriality: Number.isFinite(pm) ? pm : 375_000,
    trivialThreshold: Number.isFinite(trivial) ? trivial : 25_000,
  };
}

export function classifyMaterialityImpact(
  amount: number,
  cfg: MaterialityConfig,
): MaterialityImpact {
  if (amount <= cfg.trivialThreshold) return "trivial";
  if (amount < cfg.performanceMateriality) return "below_pm";
  return "above_pm";
}

/** Best-effort amount extraction from rule evidence shapes. */
export function amountFromEvidence(evidence: unknown): number {
  if (!evidence || typeof evidence !== "object") return 0;
  const e = evidence as Record<string, unknown>;
  if (typeof e.amount === "number") return e.amount;
  if (typeof e.total === "number") return e.total;
  if (Array.isArray(e.amounts)) {
    return e.amounts.reduce<number>(
      (s, a) => s + (typeof a === "number" ? a : 0),
      0,
    );
  }
  return 0;
}
