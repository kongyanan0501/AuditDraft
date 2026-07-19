# AuditDraft · 安永路演 PPT

| 文件 | 说明 |
| --- | --- |
| `AuditDraft-EY-Pitch.pptx` | 正式路演幻灯片（13 页，含演讲者备注） |
| `build-ey-pitch.mjs` | 用 Anthropic `pptx` skill + pptxgenjs 重新生成 |
| [`../ey-pitch-script.md`](../ey-pitch-script.md) | 完整演讲稿 + 追问速查 + 3 分钟压缩版 |

## 重新生成

```bash
cd docs/pitch
npm install
node build-ey-pitch.mjs
```

## 使用建议

1. 用 PowerPoint / Keynote 打开，演讲者视图看 **备注**（每页已写好秒级话术）。  
2. 主路演走 1–12 页（约 5–6 分钟），第 13 页为追问备用。  
3. PPT 结束后切 Demo：[`../demo-script-ey.md`](../demo-script-ey.md)。  
4. 数字以 `evals/out/latest.json` 与 `evals/human-baseline.json` 为准；若评测更新，改 `build-ey-pitch.mjs` 第 7 页后重跑生成。
