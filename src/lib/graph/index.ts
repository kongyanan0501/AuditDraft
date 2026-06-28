// LangGraph 审计流程编排入口。节点顺序集中在此定义：
// parseData → auditPlanner → ruleEngine → anomalyDetection
// → riskAssessment → workpaperGeneration → reportExport
// 设计依据：src/lib/graph/AGENTS.md、ARCHITECTURE.md §4。

import { END, START, StateGraph } from "@langchain/langgraph";

import { createNodes, type AuditGraphDeps } from "./nodes";
import { AuditStateAnnotation } from "./state";

export type { AuditGraphDeps } from "./nodes";
export type { AuditInput, AuditState } from "./state";
export { AuditStateAnnotation } from "./state";

/**
 * 用注入依赖（llm / retrieve）构建并编译审计工作流图。
 * 解耦真实 provider 与测试 mock —— 单测可传 mock LLM 跑通 7 节点。
 */
export function buildAuditGraph(deps: AuditGraphDeps) {
  const nodes = createNodes(deps);

  return new StateGraph(AuditStateAnnotation)
    .addNode("parseData", nodes.parseData)
    .addNode("auditPlanner", nodes.auditPlanner)
    .addNode("ruleEngine", nodes.ruleEngine)
    .addNode("anomalyDetection", nodes.anomalyDetection)
    .addNode("riskAssessment", nodes.riskAssessment)
    .addNode("workpaperGeneration", nodes.workpaperGeneration)
    .addNode("reportExport", nodes.reportExport)
    .addEdge(START, "parseData")
    .addEdge("parseData", "auditPlanner")
    .addEdge("auditPlanner", "ruleEngine")
    .addEdge("ruleEngine", "anomalyDetection")
    .addEdge("anomalyDetection", "riskAssessment")
    .addEdge("riskAssessment", "workpaperGeneration")
    .addEdge("workpaperGeneration", "reportExport")
    .addEdge("reportExport", END)
    .compile();
}
