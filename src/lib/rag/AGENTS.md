# AGENTS.md — src/lib/rag（RAG 检索层）

## 职责
从 Pinecone 检索审计知识，为 LLM 提供专业上下文增强。

## 契约
```ts
retrieve(query: string): Promise<string[]>;
```
流程：`Query → Embedding → Pinecone → Top-K → LLM`。

## 知识条目结构
```json
{ "type": "risk_rule", "content": "...", "risk_level": "high", "tags": ["fraud","duplicate"] }
```
知识类型：审计准则 / 风险规则 / 审计程序 / 舞弊案例。
metadata（`type / risk_level / tags`）用于过滤检索。

## 规则
- 对外只暴露 `retrieve()`，向量库实现细节内聚于本模块。
- embedding 模型与索引维度保持一致；更换向量库不改调用方契约。

## 相关
- 设计：`docs/architecture/ai-system.md` §2、`data-model.md` §4
