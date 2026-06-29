import type { RiskLevel } from "@/types/audit";

// 风险严重度 → 配色与文案。配色锁定 ui-system.md：high #ef4444 / medium #f59e0b / low #22c55e。
// 统一在此定义，组件只消费 className，避免散落硬编码颜色。

export interface SeverityStyle {
  label: string;
  /** 文本色 */
  text: string;
  /** 浅底色（卡片/徽章背景） */
  surface: string;
  /** 边框色 */
  border: string;
  /** 左侧强调条 / 圆点 */
  accent: string;
}

export const SEVERITY: Record<RiskLevel, SeverityStyle> = {
  high: {
    label: "高风险",
    text: "text-risk-high",
    surface: "bg-risk-high/10",
    border: "border-risk-high/30",
    accent: "bg-risk-high",
  },
  medium: {
    label: "中风险",
    text: "text-risk-medium",
    surface: "bg-risk-medium/10",
    border: "border-risk-medium/30",
    accent: "bg-risk-medium",
  },
  low: {
    label: "低风险",
    text: "text-risk-low",
    surface: "bg-risk-low/10",
    border: "border-risk-low/30",
    accent: "bg-risk-low",
  },
};

/** 已知风险类型 → 中文标签。未知类型回退为原始值。 */
export const RISK_TYPE_LABEL: Record<string, string> = {
  duplicate_payment: "重复付款 / 重复发票",
  missing_approval: "无审批大额支出",
  split_expense: "拆分报销",
  abnormal_amount: "金额异常离群",
};

export function riskTypeLabel(riskType: string): string {
  return RISK_TYPE_LABEL[riskType] ?? riskType;
}
