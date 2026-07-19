/** Tunable rule thresholds (env defaults; UI preview can override). */

export type RuleConfig = {
  approvalThreshold: number;
  splitNearRatio: number;
  zScoreThreshold: number;
};

export const DEFAULT_RULE_CONFIG: RuleConfig = {
  approvalThreshold: 10_000,
  splitNearRatio: 0.8,
  zScoreThreshold: 2,
};

export function getRuleConfig(): RuleConfig {
  const approvalThreshold = Number(
    process.env.RULE_APPROVAL_THRESHOLD ?? DEFAULT_RULE_CONFIG.approvalThreshold,
  );
  const splitNearRatio = Number(
    process.env.RULE_SPLIT_NEAR_RATIO ?? DEFAULT_RULE_CONFIG.splitNearRatio,
  );
  const zScoreThreshold = Number(
    process.env.RULE_ZSCORE_THRESHOLD ?? DEFAULT_RULE_CONFIG.zScoreThreshold,
  );
  return {
    approvalThreshold: Number.isFinite(approvalThreshold)
      ? approvalThreshold
      : DEFAULT_RULE_CONFIG.approvalThreshold,
    splitNearRatio: Number.isFinite(splitNearRatio)
      ? splitNearRatio
      : DEFAULT_RULE_CONFIG.splitNearRatio,
    zScoreThreshold: Number.isFinite(zScoreThreshold)
      ? zScoreThreshold
      : DEFAULT_RULE_CONFIG.zScoreThreshold,
  };
}

export function mergeRuleConfig(partial?: Partial<RuleConfig>): RuleConfig {
  return { ...getRuleConfig(), ...partial };
}
