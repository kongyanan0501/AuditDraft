# 包 C · 制胜差异 — 执行清单与 User Check

> 父文档：[`ey-first-place-roadmap.md`](./ey-first-place-roadmap.md)  
> 前置：包 A / B 已完成  
> **顺序：C1 → C2 → C3 → C4 → C5**

---

## 进度总表

| 步骤 | 状态 | 你 Check 了吗 |
| --- | --- | --- |
| C1 纯 LLM 对照墙 | `done_awaiting_check` | [ ] |
| C2 规则调参台 | `done_awaiting_check` | [ ] |
| C3 多源勾稽 | `done_awaiting_check` | [ ] |
| C4 评委挑战模式 | `done_awaiting_check` | [ ] |
| C5 试点方案页 | `done_awaiting_check` | [ ] |

---

## C1 · 纯 LLM vs AuditDraft 对照墙

### ✅ Check
1. [ ] 打开 `/contrast`，左右对比清晰  
2. [ ] 能向评委指出：一侧可编造/无证据，一侧四要素齐全  
3. [ ] 话术不含「颠覆」，强调可治理协审  

---

## C2 · 规则调参台

### ✅ Check
1. [ ] 打开 `/settings/rules`，能改审批阈值等  
2. [ ] 调整后预览 findings 数量/集合发生变化  
3. [ ] 说明「专业判断仍在人」可见  

---

## C3 · 多源勾稽（报销 ↔ 付款）

### ✅ Check
1. [ ] 存在演示用报销+付款样本  
2. [ ] 能看到勾稽类 finding（有报销无付款 / 金额不一致等）  
3. [ ] 证据能指到两侧记录  

---

## C4 · 评委挑战模式

### ✅ Check
1. [ ] 打开 `/challenge`，上传任意 CSV（或评委文件）  
2. [ ] 约 1 分钟内出可解释 findings（规则-only，不依赖 LLM）  
3. [ ] 无需先建任务也能演示  

---

## C5 · 试点方案路演页

### ✅ Check
1. [ ] 打开 `/pilot`，有范围 / 成功指标 / 风险 / 推广路径  
2. [ ] 像对内提案，不像营销海报  

---

## 包 C DoD

1. [ ] C1～C5 均为 `checked`  
2. [ ] `npm run typecheck && npm run test` 全绿  
3. [ ] 回复「包 C 全部 OK」→ 冲第一三包闭环  
