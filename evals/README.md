# Golden Set 评测（离线）

> 只跑确定性规则引擎（`runRules`），**不依赖 LLM / Pinecone / 网络**。

## 用法

```bash
npm run build:golden   # 从 planted_risks + 正常行重建标注集
npm run eval:golden    # 跑评测并写入 evals/out/latest.json
```

## 阈值（向评委复述用）

| 指标 | 最低要求 | 含义 |
| --- | --- | --- |
| Recall | ≥ 0.95 | 正例（埋雷）被正确命中的比例 |
| Precision | ≥ 0.90 | 标注为不应开火的负例上，误报要足够低 |
| Explainability | 100% | 每条 finding 都有 triggeredRule / evidence / explanation |

路演一句：「我们在固定 Golden Set 上离线回归，召回 ≥95%、精确率 ≥90%，且零无证据结论。」

## 文件

| 路径 | 说明 |
| --- | --- |
| `evals/golden/expense_v1.json` | 标注集 |
| `evals/out/latest.json` | 最近一次评测结果（Eval 页读取） |
| `src/lib/eval/runGolden.ts` | 评测实现 |

## 案例怎么判

- **正例 `shouldFire: true`**：全量跑规则后，期望规则的 evidence 覆盖该案全部 `transactionIds`。
- **负例 `shouldFire: false`**：期望规则的 evidence **不应**触及该案任一 `transactionIds`。
