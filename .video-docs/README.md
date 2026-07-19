# Video Documentation

Step-by-step tutorial videos for **AuditDraft**.

> Made with [video-docs-builder](https://github.com/video-docs-builder/video-docs-builder)

---

## Structure

```
.video-docs/
├── config.json      ← app URL and credentials (keep private, add to .gitignore if needed)
├── flows/           ← recording scripts — commit these
├── output/          ← generated videos and audio — gitignored (heavy files)
└── docs/            ← React documentation site — commit or ignore as needed
```

## Regenerate videos

### Install the skill
```bash
npx skills add https://github.com/video-docs-builder/video-docs-builder
```

### Re-run a flow
From the skill directory (`~/.claude/skills/video-docs-builder/`):
```bash
bash scripts/run-all.sh /Users/huangdeyu/Documents/coderHDY/AuditDraft/.video-docs/flows/<flow>.json
```

### Re-generate the docs site
```bash
npx tsx scripts/generate-docs-site.ts /Users/huangdeyu/Documents/coderHDY/AuditDraft/.video-docs --dev
```

### Record a new section
```bash
# Analyze the app first
npx tsx scripts/analyze-app.ts /Users/huangdeyu/Documents/coderHDY/AuditDraft/.video-docs

# Then run the full pipeline for the new flow
bash scripts/run-all.sh /Users/huangdeyu/Documents/coderHDY/AuditDraft/.video-docs/flows/<new-flow>.json
```
