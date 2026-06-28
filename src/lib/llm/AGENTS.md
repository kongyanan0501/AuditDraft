# AGENTS.md — src/lib/llm（LLM 抽象层）

## 职责
统一封装大模型调用。业务层（graph / api）只依赖 `LLMProvider` 接口，**不直接 import** OpenAI/Anthropic SDK。

## 契约
```ts
export interface LLMProvider {
  generate(prompt: string): Promise<string>;
}
```
支持 OpenAI GPT-4.1 / Claude / 本地模型（可扩展）。通过配置选择默认 provider。

## 规则
- 新增模型 = 新增一个实现 `LLMProvider` 的类/函数，不改调用方。
- Prompt 模板集中放在 `prompts/`，可版本化复用。四类 Prompt：Audit Planner / Audit Executor / Risk Engine / Workpaper Generator。
- 不在此层写审计业务判断逻辑（那是 rules / graph 的事）。

## 相关
- 设计：`docs/architecture/ai-system.md` §1、§5
- 规则：`.cursor/rules/ai-pipeline.mdc`
