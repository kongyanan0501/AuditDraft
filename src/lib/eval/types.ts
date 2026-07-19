import type { RuleId } from "@/lib/rules";

export type GoldenCase = {
  id: string;
  transactionIds: string[];
  expectedRuleIds: RuleId[] | string[];
  shouldFire: boolean;
  notes?: string;
};

export type GoldenSet = {
  version: string;
  dataset: string;
  rulesetVersion: string;
  thresholds: {
    recallMin: number;
    precisionMin: number;
    explainabilityRequired: boolean;
  };
  cases: GoldenCase[];
};

export type CaseResult = {
  id: string;
  shouldFire: boolean;
  expectedRuleIds: string[];
  passed: boolean;
  kind: "tp" | "tn" | "fp" | "fn";
  detail: string;
};

export type GoldenEvalResult = {
  version: string;
  dataset: string;
  rulesetVersion: string;
  ranAt: string;
  offline: true;
  metrics: {
    caseCount: number;
    tp: number;
    tn: number;
    fp: number;
    fn: number;
    precision: number;
    recall: number;
    f1: number;
    explainabilityPass: boolean;
    explainabilityFailures: number;
  };
  thresholds: GoldenSet["thresholds"];
  thresholdsMet: boolean;
  cases: CaseResult[];
};
