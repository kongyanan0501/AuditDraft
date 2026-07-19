# 安永华明演示 · 赛前 Runbook（5 分钟）

> 配套：[`ey-package-a-tasks.md`](./ey-package-a-tasks.md) · [`demo-script-ey.md`](./demo-script-ey.md)（A6）

## 赛前检查单

- [ ] `.env.local` 已配置 Supabase（完整模式另需 LLM/Pinecone；**降级模式可无 LLM**）
- [ ] 已执行 `supabase/migrations/*.sql`
- [ ] `npm run check:env`（降级时可只保证 Supabase 变量；完整模式需全部）
- [ ] `npm run eval:golden` 已跑，`evals/out/latest.json` 存在
- [ ] `npm run generate:snapshot` 已跑，`samples/demo-snapshots/report_ey_demo.json` 存在
- [ ] `npm run dev` 或生产 URL 可访问
- [ ] 准备演示账号（建议全新账号）
- [ ] 主数据集：`samples/ey_expense_demo_3k.csv`
- [ ] 埋雷说明打开备用：`samples/EY_DEMO_PLANTED_RISKS.md`

## 演示日推荐配置

| 场景 | 环境变量 | 说明 |
| --- | --- | --- |
| LLM 额度正常 | 不设降级 / 注释掉 `AUDIT_DEGRADED_MODE` | 完整 7 节点 + 生成底稿 |
| LLM 额度不足 / 怕翻车 | `AUDIT_DEGRADED_MODE=rules_only` | 规则+模板底稿，故事仍完整 |
| 断网 / API 全挂 | 打开 `/demo/snapshot` | 官方快照，标注 failover |

改环境变量后**必须重启** `npm run dev`。

## 故障切换顺序

1. Live 任务失败 → 点「重试」；确认是否已开降级  
2. 仍失败 → 侧栏 **可信证据 Eval** 讲数字（不依赖任务）  
3. 仍要展示风险卡/底稿 → **官方演示快照** `/demo/snapshot`  
4. 个人备注：预跑成功的 live job 链接：`________________`

## 个人备注（请手填）

- 演示账号邮箱：  
- 预跑 done 任务 URL：  
- 备用话术负责人：  
