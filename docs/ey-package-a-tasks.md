# 包 A · 可信 — 执行清单与 User Check

> 父文档：[`ey-first-place-roadmap.md`](./ey-first-place-roadmap.md)  
> 目标：实用性 / 可验证性 / 演示不翻车 → 评委 9+  
> **执行规则：严格按 A1 → A2 → A3 → A4 → A5 → A6 顺序；每完成一步，你按该步「✅ 你需要 Check」勾选后再让我继续下一步。**

---

## 进度总表

| 步骤 | 状态 | 你 Check 了吗 |
| --- | --- | --- |
| A1 大数据演示集 | `done_awaiting_check` | [ ] |
| A2 Golden Set 评测 | `pending` | [ ] |
| A3 Eval 对比页 | `pending` | [ ] |
| A4 规则-only 降级 | `pending` | [ ] |
| A5 演示快照兜底 | `pending` | [ ] |
| A6 安永演示脚本 | `pending` | [ ] |

> 状态约定：`pending` → `in_progress` → `done_awaiting_check` → `checked`（你勾选后）

---

## A1 · 大规模脱敏演示数据集

### 我会交付

| 文件 | 说明 |
| --- | --- |
| `scripts/generate-demo-dataset.ts` | 固定 seed 生成器 |
| `samples/ey_expense_demo_3k.csv` | ≥3000 行主演示集 |
| `samples/planted_risks.json` | 埋雷机器可读清单（供断言） |
| `samples/EY_DEMO_PLANTED_RISKS.md` | 埋雷说明书（路演用） |
| `scripts/assert-planted-risks.ts` | 断言埋雷 100% 被规则命中 |
| `package.json` | `generate:demo-data` / `assert:planted` |

### 埋雷配额

| 风险族 | 最少簇/笔数 | 规则 |
| --- | --- | --- |
| 重复付款 | ≥8 簇 | `duplicate_payment` |
| 无审批大额 | ≥10 笔 | `missing_approval` |
| 拆分报销 | ≥6 簇 | `split_expense` |
| 金额离群 | ≥4 笔 | `abnormal_amount` |
| 正常交易 | ≥85% | （测误报） |

### ✅ 你需要 Check（A1）

完成下列全部项后，把进度总表 A1 的「你 Check 了吗」打勾，并回复「A1 OK」：

1. [ ] 仓库里存在 `samples/ey_expense_demo_3k.csv`，用编辑器/Excel 打开表头为 `id,vendor,amount,approver,invoice_id`，数据行数 ≥ 3000  
2. [ ] 本地执行 `npm run generate:demo-data` 可重新生成且不报错  
3. [ ] 本地执行 `npm run assert:planted` **退出码 0**，终端显示各规则埋雷全部命中  
4. [ ] 打开 `samples/EY_DEMO_PLANTED_RISKS.md`，能看懂至少 4 类风险的示例行号/供应商，并想象得出路演时怎么指  
5. [ ] （可选加分）登录工作台上传该 CSV，任务能创建成功（不要求本步跑完 LLM）

**卡住时把终端完整报错贴给我。**

---

## A2 · Golden Set 与离线评测

### 我会交付

| 文件 | 说明 |
| --- | --- |
| `evals/golden/expense_v1.json` | 标注集（正例+负例） |
| `src/lib/eval/runGolden.ts` | 评测核心（只调 `runRules`） |
| `scripts/run-golden-eval.ts` | CLI |
| `evals/out/latest.json` | 最近一次结果（可 gitignore 或入仓一份） |
| `evals/README.md` | 阈值与用法 |
| `package.json` | `eval:golden` |

### ✅ 你需要 Check（A2）

回复「A2 OK」前确认：

1. [ ] `npm run eval:golden` 退出码 0  
2. [ ] 终端打印 Precision / Recall / F1，且 Recall（正例）≥ 文档阈值  
3. [ ] 存在 `evals/out/latest.json`，打开能看到 `metrics` 与样本明细  
4. [ ] `evals/README.md` 写清了阈值含义（你能向评委复述一句）  
5. [ ] **确认无网络**：断网或未配 LLM key 时，`eval:golden` 仍能跑（纯规则）

---

## A3 · Eval / 人工对比页

### 我会交付

| 文件 | 说明 |
| --- | --- |
| `evals/human-baseline.json` | 人工基线（可先填合理演示值） |
| `src/app/(app)/eval/page.tsx` | 可信证据页 |
| 侧栏入口 | Eval / 可信证据 |
| （可选）`src/app/api/eval/golden/route.ts` | 读最新评测结果 |

### ✅ 你需要 Check（A3）

回复「A3 OK」前确认：

1. [ ] `npm run dev` → 登录后侧栏能看到 **Eval / 可信证据**  
2. [ ] 打开 `/eval`，15 秒内能念出：召回、精确率/误报相关、人工 vs 系统耗时  
3. [ ] 页上数字与刚跑的 `npm run eval:golden` **一致或同源**  
4. [ ] 页上有「AI-assisted draft / 需人工复核」类免责文案  
5. [ ] 手机宽度或窄窗下页面不严重破版（侧栏可折叠即可）

---

## A4 · 规则-only 降级模式

### 我会交付

| 文件 | 说明 |
| --- | --- |
| `.env.example` + `src/lib/env.ts` | `AUDIT_DEGRADED_MODE=rules_only` |
| graph 节点降级逻辑 | 跳过 LLM，模板底稿 |
| 模板底稿生成函数 | 含四要素 + 降级声明 |
| Job UI 徽章 | 显示降级模式 |
| `tests/graph.test.ts` | degraded 用例 |

### ✅ 你需要 Check（A4）

回复「A4 OK」前确认：

1. [ ] `.env.local` 增加一行 `AUDIT_DEGRADED_MODE=rules_only` 后重启 `npm run dev`  
2. [ ] 上传小样或 3k CSV，任务能到 `done`（**即使 LLM key 无效/缺失**）  
3. [ ] 打开报告：有 findings + 底稿骨架，且能看出「降级/未调用 LLM」提示  
4. [ ] `npm run test` 含 degraded 相关用例且全绿  
5. [ ] Check 完后：**记得把 `.env.local` 的降级开关去掉或改回**（除非你演示日就要用降级）

---

## A5 · 预计算演示快照

### 我会交付

| 文件 | 说明 |
| --- | --- |
| `samples/demo-snapshots/report_ey_demo.json` | 官方只读快照 |
| UI「查看官方演示快照」 | 不依赖 Storage/LLM |
| `docs/ey-demo-runbook.md` | 赛前 5 分钟检查单 |

### ✅ 你需要 Check（A5）

回复「A5 OK」前确认：

1. [ ] 不上传文件也能打开快照页，看到风险卡 + 底稿  
2. [ ] 快照有明确标注（如 Snapshot / 故障兜底），不会被误认为造假 live 结果  
3. [ ] 按 `docs/ey-demo-runbook.md` 走一遍赛前检查，条目你都理解  
4. [ ] （推荐）用真实账号预跑一条 `done` 任务并记下 job 链接，写进 runbook 个人备注

---

## A6 · 安永版演示脚本

### 我会交付

| 文件 | 说明 |
| --- | --- |
| `docs/demo-script-ey.md` | 3～5 分钟话术 + 故障预案 |
| 更新进度 / todo | 包 A DoD 勾选指引 |

### ✅ 你需要 Check（A6）

回复「A6 OK」前确认：

1. [ ] 对着 `demo-script-ey.md` **自己干跑 1 次**（完整模式或降级+快照）无卡点  
2. [ ] 话术里**没有**「替代审计师 / 颠覆审计 / 自动出审计意见」  
3. [ ] 故障预案你走过一次（切降级或打开快照）  
4. [ ] `npm run typecheck && npm run lint && npm run test` 全绿  

---

## 包 A 总完成定义（全部 Check 后）

1. [ ] A1～A6 进度总表均为 `checked`  
2. [ ] 你能在 3 分钟内向同事讲清：大数据集、评测数字、降级、快照四件套  
3. [ ] 回复「包 A 全部 OK」后，我再拆包 B 任务清单  

---

## 协作约定

- 我每做完一步，会把该步状态改为 `done_awaiting_check`，并在回复里用简短列表重复 Check 要点。  
- **请你实际跑命令/点页面**，不要只看文件存在。  
- 某步 Check 失败：直接说「A? 失败」+ 现象/报错，我修完你再 Check，不跳步。
