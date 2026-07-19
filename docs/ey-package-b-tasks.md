# 包 B · 像安永 — 执行清单与 User Check

> 父文档：[`ey-first-place-roadmap.md`](./ey-first-place-roadmap.md)  
> 前置：包 A 已完成（[`ey-package-a-tasks.md`](./ey-package-a-tasks.md)）  
> **顺序：B1 → B2 → B3 → B4 → B5；每步完成后你按 Check 勾选。**

---

## 进度总表

| 步骤 | 状态 | 你 Check 了吗 |
| --- | --- | --- |
| B1 重要性参数 | `done_awaiting_check` | [ ] |
| B2 Review 复核流 | `done_awaiting_check` | [ ] |
| B3 事务所版式底稿 | `done_awaiting_check` | [ ] |
| B4 审计程序建议 | `done_awaiting_check` | [ ] |
| B5 RAI / 轨迹 / 版本 | `done_awaiting_check` | [ ] |

---

## B1 · 重要性参数

### 交付物
- 默认重要性配置（planning / performance / trivial）
- 报告与 finding 带 `materialityImpact`
- Job / Eval 可见当前重要性数字

### ✅ 你需要 Check（B1）
1. [ ] 跑一条审计（降级即可），打开任务详情，能看到重要性参数（如 PM / trivial）  
2. [ ] 至少一条 finding 显示 materiality 影响（如 above_pm / below_pm / trivial）  
3. [ ] 改 `.env.local` 中 `MATERIALITY_PLANNING` 等后重启，数字会变（若已接 env）

---

## B2 · Review 复核流

### 交付物
- Finding 复核状态：`open` / `cleared` / `exception`
- Job 页可切换状态并持久化
- 高风险未 cleared 时有提示（人工门闩叙事）

### ✅ 你需要 Check（B2）
1. [ ] 打开 done 任务，风险卡上能改复核状态  
2. [ ] 刷新页面后状态仍在  
3. [ ] 存在「须复核」类提示文案  

---

## B3 · 事务所版式底稿导出

### 交付物
- Word 导出含：封面信息、W/P 索引感、程序、发现、结论、免责声明
- 降级模板底稿同步增加索引结构

### ✅ 你需要 Check（B3）
1. [ ] 对 done 任务导出 Word，用 Word/Pages 打开  
2. [ ] 能看到封面/免责/风险与程序相关章节（不必完美排版）  
3. [ ] 文中有「AI-assisted draft / 须复核」表述  

---

## B4 · 审计程序建议

### 交付物
- 每类风险绑定 `recommendedProcedures[]`
- Risk Card 可展开看到「建议程序」

### ✅ 你需要 Check（B4）
1. [ ] 展开任一风险卡，看到建议审计程序（至少 1 条）  
2. [ ] 程序表述像审计语言（询问/检查/重新执行等），不是空话  

---

## B5 · Responsible AI / 轨迹 / 版本元数据

### 交付物
- 报告 `meta`：rulesetVersion、materiality、trail 事件、mode  
- `/governance` 或 Eval 扩展：系统卡（能力边界、禁止用途）  
- Job 页可见版本/轨迹摘要  

### ✅ 你需要 Check（B5）
1. [ ] 打开治理/系统卡页面，能向评委念「能力边界 + 禁止用途」  
2. [ ] 某条 done 报告含 ruleset 版本与至少 1 条 trail  
3. [ ] 降级模式仍写入 trail（如 `mode=rules_only`）  

---

## 包 B DoD

1. [ ] B1～B5 进度均为 `checked`  
2. [ ] 用安永话术能串：重要性 → 发现 → 程序 → 复核 → 治理  
3. [ ] `npm run typecheck && npm run test` 全绿  
4. [ ] 回复「包 B 全部 OK」后进入包 C  
