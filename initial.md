````markdown
# 📄 AuditDraft AI（决赛版完整项目设计文档）

> 🏆 AI审计创新大赛参赛作品  
> 💡 智能审计底稿生成 + 风险识别 + 可解释审计系统  
> 🧠 基于 Next.js + Supabase + LangGraph + RAG（Pinecone）

---

# 🧭 1. 项目概述

## 📌 项目名称
**AuditDraft AI**

## 📌 项目定位
AuditDraft AI 是一个面向审计与财务场景的 AI 智能审计工作流系统，通过：

- AI Agent 审计流程编排（LangGraph）
- 审计知识库增强（RAG + Pinecone）
- 规则引擎 + LLM 混合推理
- 自动生成审计工作底稿（Word/PDF）

将传统审计流程从：

> Excel数据 → 人工分析 → 手工编写底稿（2~4小时）

升级为：

> Excel → AI审计流程 → 自动生成标准审计底稿（30秒）

---

## 🎯 核心价值

- ⚡ 审计效率提升 80%+
- 📉 降低人为错误
- 📊 标准化审计输出
- 🧠 可解释 AI 审计决策
- 🏢 企业级可落地架构

---

# 🏗 2. 系统总体架构（关键）

```text
                ┌────────────────────────────┐
                │      Next.js Frontend      │
                │   (UI + API Routes BFF)    │
                └────────────┬───────────────┘
                             │
         ┌───────────────────┼────────────────────┐
         │                   │                    │
         ▼                   ▼                    ▼

   LLM Service        RAG Service        Data Service
 (OpenAI/Claude)     (Pinecone)        (Supabase DB)
         │                   │                    │
         └────────────┬──────┴───────┬────────────┘
                      ▼
           🧠 LangGraph Orchestrator
        (Audit Workflow Engine / Agent System)
                      ▼
        ┌────────────────────────────┐
        │ Audit Output Generator     │
        │ (Report / Word / PDF)      │
        └────────────────────────────┘
````

---

# ⚙️ 3. 技术栈设计

## 🧑‍💻 前后端

* Next.js 14+ (App Router)
* React Server Components
* API Routes (BFF Layer)
* TailwindCSS + shadcn/ui

---

## 🗄 数据库（Supabase）

### 功能

* 用户认证
* 审计任务管理
* 审计结果存储
* 文件上传记录

---

### 📊 表结构设计

```sql
audit_jobs (
  id uuid,
  user_id uuid,
  filename text,
  status text,
  created_at timestamp
);

audit_reports (
  id uuid,
  job_id uuid,
  report_json jsonb,
  risk_level text,
  created_at timestamp
);

audit_raw_data (
  id uuid,
  job_id uuid,
  data jsonb
);
```

---

# 🔐 4. 登录系统（Supabase Auth）

## 功能

* Email + Password 登录
* 用户隔离数据
* Session 管理

---

## 登录流程

```text
User → Next.js API → Supabase Auth → Session
```

---

## 核心API

### 登录

```ts
supabase.auth.signInWithPassword({
  email,
  password
});
```

---

### 注册

```ts
supabase.auth.signUp({
  email,
  password
});
```

---

## 产品价值

* SaaS化系统
* 多用户支持
* 企业级可部署

---

# 🧠 5. AI系统架构（核心）

---

## 🧩 LLM层（解耦）

```ts
export interface LLMProvider {
  generate(prompt: string): Promise<any>;
}
```

支持：

* OpenAI GPT-4.1
* Claude
* 本地模型（可扩展）

---

## 📚 RAG层（Pinecone）

### 架构

```text
Query → Embedding → Pinecone → Top-K Knowledge → LLM
```

---

### 知识类型

* 审计准则
* 风险规则
* 审计程序
* 真实案例

---

## 🧠 RAG接口

```ts
retrieve(query: string): Promise<string[]>
```

---

## 🔧 Rule Engine（确定性层）

```ts
duplicate_payment
missing_approval
split_expense
abnormal_amount
```

👉 不依赖 LLM（提高可靠性）

---

# 🧠 6. LangGraph 审计流程引擎

---

## 🔁 工作流

```text
parseData
  ↓
auditPlanner (LLM + RAG)
  ↓
ruleEngine (deterministic)
  ↓
anomalyDetection
  ↓
riskAssessment
  ↓
workpaperGeneration
  ↓
reportExport
```

---

## 🧠 设计理念

* LLM负责“理解与生成”
* Rule Engine负责“确定性检测”
* RAG负责“专业知识增强”

---

# 🎨 7. UI系统设计（Figma级）

---

## 🧱 Layout

```text
┌──────────────────────────────┐
│ Top Bar                      │
├──────────┬───────────────────┤
│ Sidebar  │ Main Workspace    │
│          │                   │
│ Jobs     │ Workflow Graph   │
│ Reports  │ Risk Panel       │
│ RAG      │ Report Viewer    │
└──────────┴───────────────────┘
```

---

## 🎯 视觉风格

* Enterprise SaaS
* Notion × Palantir 风格
* 数据分析控制台

---

## 🎨 色彩系统

| 类型         | 颜色      |
| ---------- | ------- |
| Primary    | #111827 |
| Success    | #22c55e |
| Warning    | #f59e0b |
| High Risk  | #ef4444 |
| Background | #f8fafc |

---

## 📊 核心UI模块

### 1. Workflow Tracker

* 审计流程可视化
* 实时状态更新

---

### 2. Risk Cards

```text
🚨 High Risk
Duplicate Payment
Evidence: invoice_id match
Severity: HIGH
```

---

### 3. Audit Report Viewer

* Notion风格文档
* 可折叠结构
* 风险高亮

---

### 4. Explainability Panel

* rule触发原因
* 数据证据
* 审计标准引用

---

# 🧠 8. RAG知识库设计（Pinecone）

---

## 📦 数据结构

```json
{
  "type": "risk_rule",
  "content": "同一供应商+相同金额+重复发票=重复付款风险",
  "risk_level": "high",
  "tags": ["fraud", "duplicate"]
}
```

---

## 📚 知识分类

### 1. 审计准则

### 2. 风险规则

### 3. 审计程序

### 4. 舞弊案例

---

## 🔍 检索流程

```text
User Query → Embedding → Pinecone → Top-K → LLM
```

---

# 🧪 9. 审计规则引擎（关键）

```ts
duplicate_payment:
  same vendor + same amount + same invoice

missing_approval:
  amount > 10000 && approver == null

split_expense:
  multiple transactions close to approval threshold
```

---

# 📊 10. 冲奖数据集设计

---

## 📄 expense_transactions.csv

| id | vendor | amount | approver | invoice_id |
| -- | ------ | ------ | -------- | ---------- |
| 1  | ABC    | 5000   | null     | INV-1001   |
| 2  | ABC    | 5000   | null     | INV-1001   |
| 3  | XYZ    | 12000  | John     | INV-2001   |
| 4  | LMN    | 20000  | null     | INV-3001   |

---

## 🚨 内置风险

* 重复付款
* 拆分报销
* 无审批大额支出
* 重复发票

---

# 🧠 11. Prompt工程（四大级）

---

## Audit Planner

* 风险识别
* 审计程序生成
* 结构化输出

---

## Audit Executor

* 异常检测
* 数据分析
* 规则匹配

---

## Risk Engine

* 风险评级
* 内控判断
* 审计建议

---

## Workpaper Generator

* 标准审计底稿
* 可归档格式
* 专业审计语言

---

# 🧠 12. 可解释AI系统

每个结论提供：

* 触发规则
* 数据证据
* 审计标准
* 风险解释

---

# 🧱 13. 系统解耦设计（关键）

## 模块独立性

| 模块          | 是否可替换 |
| ----------- | ----- |
| LLM         | ✔     |
| RAG         | ✔     |
| DB          | ✔     |
| Rule Engine | ✔     |
| UI          | ✔     |

---

# 🏢 14. 产品化能力

系统支持：

* 多用户登录
* 审计任务管理
* 报告归档
* 企业级扩展

---

# 🏆 15. 项目总结（评委视角）

## 技术亮点

* LangGraph审计流程引擎
* Pinecone RAG知识增强
* 规则 + LLM混合推理
* 可解释AI审计系统

---

## 业务亮点

* 自动生成审计底稿
* 自动识别财务风险
* 标准化审计流程
* 企业可落地

---

## 产品亮点

* 30秒生成审计报告
* 可视化审计流程
* 风险可解释
* SaaS级架构

---

# 🚀 结论

> AuditDraft AI = 审计流程数字化引擎 + AI审计团队 + 可解释风险系统

---

```
```
