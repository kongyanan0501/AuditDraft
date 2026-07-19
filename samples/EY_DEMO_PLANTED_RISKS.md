# EY 演示集埋雷说明

> 对应文件：`samples/ey_expense_demo_3k.csv`  
> 机器清单：`samples/planted_risks.json`  
> 生成：`npm run generate:demo-data`（seed=42）  
> 断言：`npm run assert:planted`

本集为**脱敏合成数据**，仅用于安永华明 AI 赛演示与评测，不含真实客户信息。

## 规模

- 目标行数：≥ 3000（生成器固定输出 3000 行）
- 表头：`id,vendor,amount,approver,invoice_id`（兼容现有 parser）
- 正常交易占比：设计上 ≥ 85%（其余为埋雷相关行）

## 埋雷一览

### 重复付款 / 重复发票（8）

| 埋雷 ID | 供应商 | 交易 ID | 等级 | 路演一句 |
| --- | --- | --- | --- | --- |
| plant-dup-1 | DupVendor-01 | 1, 2 | high | 同供应商同金额同发票号出现 2 笔，典型重复付款红旗。 |
| plant-dup-2 | DupVendor-02 | 3, 4 | high | 同供应商同金额同发票号出现 2 笔，典型重复付款红旗。 |
| plant-dup-3 | DupVendor-03 | 5, 6 | high | 同供应商同金额同发票号出现 2 笔，典型重复付款红旗。 |
| plant-dup-4 | DupVendor-04 | 7, 8 | high | 同供应商同金额同发票号出现 2 笔，典型重复付款红旗。 |
| plant-dup-5 | DupVendor-05 | 9, 10 | high | 同供应商同金额同发票号出现 2 笔，典型重复付款红旗。 |
| plant-dup-6 | DupVendor-06 | 11, 12 | high | 同供应商同金额同发票号出现 2 笔，典型重复付款红旗。 |
| plant-dup-7 | DupVendor-07 | 13, 14 | high | 同供应商同金额同发票号出现 2 笔，典型重复付款红旗。 |
| plant-dup-8 | DupVendor-08 | 15, 16 | high | 同供应商同金额同发票号出现 2 笔，典型重复付款红旗。 |

### 无审批大额（10）

| 埋雷 ID | 供应商 | 交易 ID | 等级 | 路演一句 |
| --- | --- | --- | --- | --- |
| plant-na-1 | NoAppr-01 | 17 | high | 金额超过审批阈值 10000 且无审批人。 |
| plant-na-2 | NoAppr-02 | 18 | high | 金额超过审批阈值 10000 且无审批人。 |
| plant-na-3 | NoAppr-03 | 19 | high | 金额超过审批阈值 10000 且无审批人。 |
| plant-na-4 | NoAppr-04 | 20 | high | 金额超过审批阈值 10000 且无审批人。 |
| plant-na-5 | NoAppr-05 | 21 | high | 金额超过审批阈值 10000 且无审批人。 |
| plant-na-6 | NoAppr-06 | 22 | high | 金额超过审批阈值 10000 且无审批人。 |
| plant-na-7 | NoAppr-07 | 23 | high | 金额超过审批阈值 10000 且无审批人。 |
| plant-na-8 | NoAppr-08 | 24 | high | 金额超过审批阈值 10000 且无审批人。 |
| plant-na-9 | NoAppr-09 | 25 | high | 金额超过审批阈值 10000 且无审批人。 |
| plant-na-10 | NoAppr-10 | 26 | high | 金额超过审批阈值 10000 且无审批人。 |

### 拆分报销（6）

| 埋雷 ID | 供应商 | 交易 ID | 等级 | 路演一句 |
| --- | --- | --- | --- | --- |
| plant-split-1 | SplitCo-01 | 27, 28 | medium | 两笔贴边低于 10000，疑似拆分规避审批。 |
| plant-split-2 | SplitCo-02 | 29, 30 | medium | 两笔贴边低于 10000，疑似拆分规避审批。 |
| plant-split-3 | SplitCo-03 | 31, 32 | medium | 两笔贴边低于 10000，疑似拆分规避审批。 |
| plant-split-4 | SplitCo-04 | 33, 34 | medium | 两笔贴边低于 10000，疑似拆分规避审批。 |
| plant-split-5 | SplitCo-05 | 35, 36 | medium | 两笔贴边低于 10000，疑似拆分规避审批。 |
| plant-split-6 | SplitCo-06 | 37, 38 | medium | 两笔贴边低于 10000，疑似拆分规避审批。 |

### 金额离群（4）

| 埋雷 ID | 供应商 | 交易 ID | 等级 | 路演一句 |
| --- | --- | --- | --- | --- |
| plant-abn-1 | MegaPay-01 | 39 | medium | 金额相对总体均值显著离群（z-score）。 |
| plant-abn-2 | MegaPay-02 | 40 | medium | 金额相对总体均值显著离群（z-score）。 |
| plant-abn-3 | MegaPay-03 | 41 | medium | 金额相对总体均值显著离群（z-score）。 |
| plant-abn-4 | MegaPay-04 | 42 | medium | 金额相对总体均值显著离群（z-score）。 |


## 路演指法

1. 上传 CSV → 等规则出 findings（完整模式可再等底稿）。
2. 打开本文件，任选一类风险，用「交易 ID」在风险卡 evidence 里对上号。
3. 强调：这些结论来自**确定性规则引擎**，同输入同输出。
