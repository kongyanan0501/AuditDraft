/**
 * AuditDraft EY competition pitch deck generator.
 * Run: node build-ey-pitch.mjs
 */
import pptxgen from "pptxgenjs";
import React from "react";
import ReactDOMServer from "react-dom/server";
import sharp from "sharp";
import {
  HiOutlineShieldCheck,
  HiOutlineDocumentSearch,
  HiOutlineScale,
  HiOutlineChip,
  HiOutlineEye,
  HiOutlineLockClosed,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamation,
  HiOutlineArrowRight,
  HiOutlineOfficeBuilding,
  HiOutlineUserGroup,
} from "react-icons/hi";
import { MdOutlineAccountBalance, MdOutlineRule } from "react-icons/md";
import { BiTargetLock } from "react-icons/bi";
import { TbBinaryTree2 } from "react-icons/tb";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// —— Palette: "Ledger Ink" (professional services, not generic AI purple) ——
const C = {
  ink: "0B0F14",
  inkSoft: "151B24",
  slate: "243041",
  gold: "C9A227",
  goldSoft: "E8D48B",
  paper: "F7F8FA",
  white: "FFFFFF",
  text: "0B0F14",
  muted: "5C6670",
  line: "D8DDE3",
  teal: "0F6E56",
  tealSoft: "E6F4EF",
  risk: "B42318",
  riskSoft: "F purpl", // placeholder fix below
};

C.riskSoft = "FCEBEA";

async function iconPng(Icon, color = "#FFFFFF", size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(Icon, { color, size: String(size) })
  );
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

function shadow() {
  return {
    type: "outer",
    color: "0B0F14",
    blur: 12,
    offset: 3,
    opacity: 0.08,
  };
}

async function main() {
  const icons = {
    shield: await iconPng(HiOutlineShieldCheck, "#C9A227"),
    search: await iconPng(HiOutlineDocumentSearch, "#C9A227"),
    scale: await iconPng(HiOutlineScale, "#C9A227"),
    chip: await iconPng(HiOutlineChip, "#C9A227"),
    eye: await iconPng(HiOutlineEye, "#C9A227"),
    lock: await iconPng(HiOutlineLockClosed, "#C9A227"),
    clock: await iconPng(HiOutlineClock, "#0F6E56"),
    check: await iconPng(HiOutlineCheckCircle, "#0F6E56"),
    alert: await iconPng(HiOutlineExclamation, "#B42318"),
    arrow: await iconPng(HiOutlineArrowRight, "#C9A227"),
    office: await iconPng(HiOutlineOfficeBuilding, "#C9A227"),
    users: await iconPng(HiOutlineUserGroup, "#C9A227"),
    bank: await iconPng(MdOutlineAccountBalance, "#C9A227"),
    rule: await iconPng(MdOutlineRule, "#C9A227"),
    target: await iconPng(BiTargetLock, "#C9A227"),
    tree: await iconPng(TbBinaryTree2, "#C9A227"),
    shieldW: await iconPng(HiOutlineShieldCheck, "#FFFFFF"),
    checkW: await iconPng(HiOutlineCheckCircle, "#FFFFFF"),
  };

  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "AuditDraft AI";
  pres.title = "AuditDraft · 安永华明 AI 赛路演";
  pres.subject = "费用循环 AI 协审工作台";

  // ═══════════════ SLIDE 1 · Cover ═══════════════
  {
    const s = pres.addSlide();
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 5.625, fill: { color: C.ink },
    });
    // subtle geometric motif — large circle + small gold orb
    s.addShape(pres.shapes.OVAL, {
      x: 7.2, y: -1.2, w: 4.2, h: 4.2,
      fill: { color: C.inkSoft },
    });
    s.addShape(pres.shapes.OVAL, {
      x: 8.55, y: 3.85, w: 0.55, h: 0.55,
      fill: { color: C.gold },
    });
    s.addImage({ data: icons.shieldW, x: 0.7, y: 0.85, w: 0.42, h: 0.42 });
    s.addText("AUDITDRAFT AI", {
      x: 1.25, y: 0.9, w: 6, h: 0.35,
      fontFace: "Arial", fontSize: 12, bold: true,
      color: C.gold, charSpacing: 4, margin: 0,
    });
    s.addText("费用循环 AI 协审工作台", {
      x: 0.7, y: 1.9, w: 8.2, h: 0.9,
      fontFace: "Arial", fontSize: 36, bold: true,
      color: C.white, margin: 0,
    });
    s.addText("确定性规则 · 可解释发现 · 可复核草稿底稿", {
      x: 0.7, y: 2.9, w: 8, h: 0.4,
      fontFace: "Arial", fontSize: 16,
      color: C.goldSoft, margin: 0,
    });
    s.addText("安永华明 AI 项目赛  ·  路演材料", {
      x: 0.7, y: 4.85, w: 6, h: 0.3,
      fontFace: "Arial", fontSize: 12,
      color: "8A93A0", margin: 0,
    });
    s.addNotes(
      "开场 15s：各位评委好。我们是 AuditDraft。今天只讲一件事——把费用循环初筛做成可复核、可评测、可治理的协审能力，而不是又一个聊天写底稿的 Demo。"
    );
  }

  // ═══════════════ SLIDE 2 · Agenda for judges ═══════════════
  {
    const s = pres.addSlide();
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 5.625, fill: { color: C.paper },
    });
    s.addText("评委今天会听到什么", {
      x: 0.6, y: 0.4, w: 8, h: 0.55,
      fontFace: "Arial", fontSize: 28, bold: true, color: C.text, margin: 0,
    });
    s.addText("四类尺子，一套证据", {
      x: 0.6, y: 0.95, w: 8, h: 0.3,
      fontFace: "Arial", fontSize: 14, color: C.muted, margin: 0,
    });

    const tiles = [
      { t: "业务 / 合伙人", d: "能否进底稿复核链\n是否像项目组工具", icon: icons.office },
      { t: "技术", d: "幻觉如何控\n指标能否复现", icon: icons.chip },
      { t: "风险 / 信安", d: "权限 · 轨迹 · 降级\n负责任 AI", icon: icons.lock },
      { t: "创新 / 商业", d: "与黑盒 Copilot 差异\n可复制到其他循环", icon: icons.target },
    ];
    tiles.forEach((tile, i) => {
      const x = 0.6 + (i % 2) * 4.55;
      const y = 1.55 + Math.floor(i / 2) * 1.7;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x, y, w: 4.25, h: 1.5,
        fill: { color: C.white },
        shadow: shadow(),
        rectRadius: 0.1,
      });
      s.addShape(pres.shapes.OVAL, {
        x: x + 0.25, y: y + 0.4, w: 0.55, h: 0.55,
        fill: { color: C.ink },
      });
      s.addImage({ data: tile.icon, x: x + 0.35, y: y + 0.5, w: 0.35, h: 0.35 });
      s.addText(tile.t, {
        x: x + 1.0, y: y + 0.3, w: 3, h: 0.35,
        fontFace: "Arial", fontSize: 15, bold: true, color: C.text, margin: 0,
      });
      s.addText(tile.d, {
        x: x + 1.0, y: y + 0.7, w: 3, h: 0.6,
        fontFace: "Arial", fontSize: 13, color: C.muted, margin: 0,
      });
    });
    s.addNotes("过渡：评委尺子是「进项目组 / 过质量 / 过信安」。我们按这四把尺子给证据。");
  }

  // ═══════════════ SLIDE 3 · Problem ═══════════════
  {
    const s = pres.addSlide();
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 5.625, fill: { color: C.paper },
    });
    s.addText("问题不在「会不会写」", {
      x: 0.6, y: 0.4, w: 9, h: 0.5,
      fontFace: "Arial", fontSize: 28, bold: true, color: C.text, margin: 0,
    });
    s.addText("而在规模化执行、可复核、可治理", {
      x: 0.6, y: 0.95, w: 9, h: 0.3,
      fontFace: "Arial", fontSize: 14, color: C.muted, margin: 0,
    });

    const pains = [
      { n: "01", t: "规模贵", d: "费用明细上千行，助理靠抽查翻表；红旗方法清楚，全量执行贵。" },
      { n: "02", t: "漏检贵", d: "重复付款、无审批大额、拆分报销、金额离群——漏一笔就是质量事件。" },
      { n: "03", t: "黑盒贵", d: "贴表问 LLM 更快，但结论不可复现、证据链进不了底稿、幻觉过不了复核。" },
    ];
    pains.forEach((p, i) => {
      const y = 1.5 + i * 1.2;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: 0.6, y, w: 8.8, h: 1.05,
        fill: { color: C.white },
        shadow: shadow(),
        rectRadius: 0.08,
      });
      s.addText(p.n, {
        x: 0.85, y: y + 0.28, w: 0.8, h: 0.5,
        fontFace: "Arial", fontSize: 22, bold: true, color: C.gold, margin: 0,
      });
      s.addText(p.t, {
        x: 1.8, y: y + 0.18, w: 7, h: 0.35,
        fontFace: "Arial", fontSize: 16, bold: true, color: C.text, margin: 0,
      });
      s.addText(p.d, {
        x: 1.8, y: y + 0.52, w: 7.2, h: 0.4,
        fontFace: "Arial", fontSize: 13, color: C.muted, margin: 0,
      });
    });
    s.addNotes(
      "40s：费用循环现实——规模贵、漏检贵、黑盒贵。事务所要的不是更会写的模型，而是进 Prepare–Review 链条的工作台。"
    );
  }

  // ═══════════════ SLIDE 4 · Positioning ═══════════════
  {
    const s = pres.addSlide();
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 5.625, fill: { color: C.paper },
    });
    s.addText("我们做什么——边界写清楚", {
      x: 0.6, y: 0.35, w: 9, h: 0.45,
      fontFace: "Arial", fontSize: 26, bold: true, color: C.text, margin: 0,
    });

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.6, y: 1.0, w: 8.8, h: 1.35,
      fill: { color: C.ink },
      rectRadius: 0.1,
    });
    s.addText("费用与报销循环 AI 协审工作台", {
      x: 0.9, y: 1.2, w: 8.2, h: 0.4,
      fontFace: "Arial", fontSize: 18, bold: true, color: C.gold, margin: 0,
    });
    s.addText("全量初筛 + 可复核草稿底稿  ·  不替代注册会计师判断  ·  不直接出审计意见", {
      x: 0.9, y: 1.7, w: 8.2, h: 0.4,
      fontFace: "Arial", fontSize: 13, color: C.white, margin: 0,
    });

    const pillars = [
      { icon: icons.rule, t: "规则保确定性", d: "硬结论只来自规则引擎\n同输入同输出，可复现" },
      { icon: icons.search, t: "RAG 锚准则", d: "方法与标准进上下文\n引用可溯源" },
      { icon: icons.users, t: "人做判断", d: "LLM 只理解与成文\n高风险须人工复核" },
    ];
    pillars.forEach((p, i) => {
      const x = 0.6 + i * 3.05;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x, y: 2.7, w: 2.9, h: 2.35,
        fill: { color: C.white },
        shadow: shadow(),
        rectRadius: 0.1,
      });
      s.addShape(pres.shapes.OVAL, {
        x: x + 1.05, y: 2.95, w: 0.7, h: 0.7,
        fill: { color: C.ink },
      });
      s.addImage({ data: p.icon, x: x + 1.18, y: 3.08, w: 0.44, h: 0.44 });
      s.addText(p.t, {
        x: x + 0.2, y: 3.85, w: 2.5, h: 0.35,
        fontFace: "Arial", fontSize: 14, bold: true, color: C.text,
        align: "center", margin: 0,
      });
      s.addText(p.d, {
        x: x + 0.2, y: 4.25, w: 2.5, h: 0.6,
        fontFace: "Arial", fontSize: 12, color: C.muted,
        align: "center", margin: 0,
      });
    });
    s.addNotes(
      "35s：边界——初筛 + 草稿底稿。三硬线：规则硬结论、RAG 锚定、LLM 只成文。口令：规则保确定性，模型做表达，人做判断。"
    );
  }

  // ═══════════════ SLIDE 5 · Architecture ═══════════════
  {
    const s = pres.addSlide();
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 5.625, fill: { color: C.paper },
    });
    s.addText("混合推理 · 可编排质量流程", {
      x: 0.55, y: 0.3, w: 9, h: 0.45,
      fontFace: "Arial", fontSize: 26, bold: true, color: C.text, margin: 0,
    });

    const steps = [
      "解析", "计划", "规则", "异常", "风险", "底稿", "导出",
    ];
    steps.forEach((label, i) => {
      const x = 0.4 + i * 1.35;
      const isRule = i === 2;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x, y: 1.05, w: 1.2, h: 0.7,
        fill: { color: isRule ? C.gold : C.ink },
        rectRadius: 0.08,
      });
      s.addText(label, {
        x, y: 1.2, w: 1.2, h: 0.4,
        fontFace: "Arial", fontSize: 13, bold: true,
        color: isRule ? C.ink : C.white,
        align: "center", margin: 0,
      });
      if (i < steps.length - 1) {
        s.addShape(pres.shapes.RIGHT_ARROW, {
          x: x + 1.15, y: 1.28, w: 0.22, h: 0.22,
          fill: { color: "A8B0BA" },
        });
      }
    });
    s.addText("LangGraph 七步  ·  规则节点是硬结论闸门（金色）", {
      x: 0.55, y: 1.9, w: 9, h: 0.3,
      fontFace: "Arial", fontSize: 12, color: C.muted, margin: 0,
    });

    const cols = [
      { t: "LLM", d: "理解与生成\n计划 / 底稿成文", c: C.slate },
      { t: "Rule Engine", d: "确定性检测\n绝不依赖 LLM", c: C.gold },
      { t: "RAG", d: "准则 · 方法 · 案例\n知识增强", c: C.teal },
    ];
    cols.forEach((col, i) => {
      const x = 0.55 + i * 3.1;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x, y: 2.4, w: 2.9, h: 2.6,
        fill: { color: C.white },
        shadow: shadow(),
        rectRadius: 0.1,
      });
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: x + 0.2, y: 2.6, w: 2.5, h: 0.55,
        fill: { color: col.c },
        rectRadius: 0.06,
      });
      s.addText(col.t, {
        x: x + 0.2, y: 2.7, w: 2.5, h: 0.4,
        fontFace: "Arial", fontSize: 14, bold: true,
        color: col.c === C.gold ? C.ink : C.white,
        align: "center", margin: 0,
      });
      s.addText(col.d, {
        x: x + 0.3, y: 3.45, w: 2.3, h: 1.2,
        fontFace: "Arial", fontSize: 14, color: C.text,
        align: "center", margin: 0,
      });
    });
    s.addNotes(
      "45s：七步编排；规则是硬闸门。节点可测、可降级、可插人工门闩。模块解耦可扩展到 AP/Payroll。"
    );
  }

  // ═══════════════ SLIDE 6 · Explainability ═══════════════
  {
    const s = pres.addSlide();
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 5.625, fill: { color: C.paper },
    });
    s.addText("可解释契约：没有证据，就没有结论", {
      x: 0.55, y: 0.3, w: 9, h: 0.5,
      fontFace: "Arial", fontSize: 24, bold: true, color: C.text, margin: 0,
    });

    const fours = [
      { icon: icons.rule, t: "触发规则", d: "哪条规则命中\n版本号可追溯" },
      { icon: icons.search, t: "数据证据", d: "原始交易行\n可定位回表" },
      { icon: icons.bank, t: "准则引用", d: "标准 / 方法锚点\nRAG 可溯源" },
      { icon: icons.eye, t: "风险解释", d: "为何重要\n建议程序方向" },
    ];
    fours.forEach((f, i) => {
      const x = 0.45 + i * 2.4;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x, y: 1.15, w: 2.25, h: 3.0,
        fill: { color: C.white },
        shadow: shadow(),
        rectRadius: 0.1,
      });
      s.addShape(pres.shapes.OVAL, {
        x: x + 0.7, y: 1.45, w: 0.85, h: 0.85,
        fill: { color: C.ink },
      });
      s.addImage({ data: f.icon, x: x + 0.88, y: 1.63, w: 0.5, h: 0.5 });
      s.addText(String(i + 1).padStart(2, "0"), {
        x: x + 0.15, y: 2.5, w: 1.95, h: 0.3,
        fontFace: "Arial", fontSize: 11, bold: true, color: C.gold,
        align: "center", margin: 0,
      });
      s.addText(f.t, {
        x: x + 0.15, y: 2.85, w: 1.95, h: 0.4,
        fontFace: "Arial", fontSize: 15, bold: true, color: C.text,
        align: "center", margin: 0,
      });
      s.addText(f.d, {
        x: x + 0.15, y: 3.35, w: 1.95, h: 0.6,
        fontFace: "Arial", fontSize: 12, color: C.muted,
        align: "center", margin: 0,
      });
    });
    s.addText("可解释性进入 Golden Set 门禁 —— 不过关就不过线", {
      x: 0.55, y: 4.5, w: 9, h: 0.35,
      fontFace: "Arial", fontSize: 13, italic: true, color: C.slate, margin: 0,
    });
    s.addNotes(
      "50s 核心页：四要素是系统约束不是文案。放慢语气。没有证据就没有结论——才能进复核链。"
    );
  }

  // ═══════════════ SLIDE 7 · Evidence metrics ═══════════════
  {
    const s = pres.addSlide();
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 5.625, fill: { color: C.paper },
    });
    s.addText("证据说话 · Golden Set & 人工对照", {
      x: 0.55, y: 0.28, w: 9, h: 0.45,
      fontFace: "Arial", fontSize: 24, bold: true, color: C.text, margin: 0,
    });
    s.addText("数据集 ey_expense_demo_3k · 135 cases · 离线 · 不依赖 LLM", {
      x: 0.55, y: 0.75, w: 9, h: 0.28,
      fontFace: "Arial", fontSize: 12, color: C.muted, margin: 0,
    });

    const metrics = [
      { v: "1.00", l: "Precision" },
      { v: "1.00", l: "Recall" },
      { v: "1.00", l: "F1" },
      { v: "100%", l: "可解释通过" },
    ];
    metrics.forEach((m, i) => {
      const x = 0.55 + i * 2.35;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x, y: 1.2, w: 2.2, h: 1.45,
        fill: { color: C.ink },
        rectRadius: 0.1,
      });
      s.addText(m.v, {
        x, y: 1.4, w: 2.2, h: 0.7,
        fontFace: "Arial", fontSize: 32, bold: true, color: C.gold,
        align: "center", margin: 0,
      });
      s.addText(m.l, {
        x, y: 2.15, w: 2.2, h: 0.3,
        fontFace: "Arial", fontSize: 12, color: C.white,
        align: "center", margin: 0,
      });
    });

    // comparison table header
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.55, y: 2.95, w: 8.9, h: 2.2,
      fill: { color: C.white },
      shadow: shadow(),
      rectRadius: 0.1,
    });
    s.addText("同一数据集：人工抽查 vs 系统全量初筛", {
      x: 0.8, y: 3.1, w: 8.4, h: 0.3,
      fontFace: "Arial", fontSize: 13, bold: true, color: C.text, margin: 0,
    });

    // mini table rows
    const rows = [
      ["", "耗时", "命中 / 埋雷", "漏报", "误报"],
      ["人工基线", "≈ 45 分钟", "24 / 28", "4", "6"],
      ["AuditDraft", "≈ 8 秒", "28 / 28", "0", "0"],
    ];
    rows.forEach((row, ri) => {
      row.forEach((cell, ci) => {
        const x = 0.8 + ci * 1.7;
        const y = 3.5 + ri * 0.45;
        const isHeader = ri === 0;
        const isSys = ri === 2;
        s.addText(cell, {
          x, y, w: 1.65, h: 0.35,
          fontFace: "Arial",
          fontSize: isHeader ? 11 : 13,
          bold: isHeader || ci === 0 || isSys,
          color: isSys && ci > 0 ? C.teal : isHeader ? C.muted : C.text,
          margin: 0,
        });
      });
    });
    s.addNotes(
      "45s：甩数字。Precision/Recall/F1=1，可解释 100%。人工 45min 命中24漏4误6；系统约8秒 28/28 误报0。现场以 /eval 为准。诚实：当前是可控演示集硬门禁。"
    );
  }

  // ═══════════════ SLIDE 8 · Contrast ═══════════════
  {
    const s = pres.addSlide();
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 5.625, fill: { color: C.paper },
    });
    s.addText("为什么不是「贴表问大模型」", {
      x: 0.55, y: 0.3, w: 9, h: 0.45,
      fontFace: "Arial", fontSize: 26, bold: true, color: C.text, margin: 0,
    });

    // left bad
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.5, y: 1.05, w: 4.35, h: 4.1,
      fill: { color: C.white },
      shadow: shadow(),
      rectRadius: 0.1,
    });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.7, y: 1.25, w: 3.95, h: 0.5,
      fill: { color: C.riskSoft },
      rectRadius: 0.06,
    });
    s.addText("纯 LLM 扫表", {
      x: 0.7, y: 1.32, w: 3.95, h: 0.4,
      fontFace: "Arial", fontSize: 15, bold: true, color: C.risk,
      align: "center", margin: 0,
    });
    const bad = [
      "可能编造无证据风险",
      "同输入不同输出",
      "难进 Prepare–Review",
      "模型挂了整条链路挂",
      "过不了质量 / 信安尺子",
    ];
    bad.forEach((t, i) => {
      s.addText("✕  " + t, {
        x: 0.85, y: 2.05 + i * 0.5, w: 3.7, h: 0.4,
        fontFace: "Arial", fontSize: 14, color: C.text, margin: 0,
      });
    });

    // right good
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 5.15, y: 1.05, w: 4.35, h: 4.1,
      fill: { color: C.white },
      shadow: shadow(),
      rectRadius: 0.1,
    });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 5.35, y: 1.25, w: 3.95, h: 0.5,
      fill: { color: C.tealSoft },
      rectRadius: 0.06,
    });
    s.addText("AuditDraft", {
      x: 5.35, y: 1.32, w: 3.95, h: 0.4,
      fontFace: "Arial", fontSize: 15, bold: true, color: C.teal,
      align: "center", margin: 0,
    });
    const good = [
      "硬结论来自规则，可复现",
      "四要素齐全才出 finding",
      "输出形态是草稿底稿",
      "规则-only 降级可继续",
      "Golden Set 可离线证明",
    ];
    good.forEach((t, i) => {
      s.addText("✓  " + t, {
        x: 5.5, y: 2.05 + i * 0.5, w: 3.7, h: 0.4,
        fontFace: "Arial", fontSize: 14, color: C.text, margin: 0,
      });
    });
    s.addNotes(
      "40s：对照墙。换掉 LLM，硬发现不变；额度没了走降级——这叫可治理。"
    );
  }

  // ═══════════════ SLIDE 9 · Responsible AI ═══════════════
  {
    const s = pres.addSlide();
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 5.625, fill: { color: C.paper },
    });
    s.addText("负责任 AI · 过得了质量与信安", {
      x: 0.55, y: 0.3, w: 9, h: 0.45,
      fontFace: "Arial", fontSize: 26, bold: true, color: C.text, margin: 0,
    });

    const gov = [
      { icon: icons.lock, t: "数据隔离", d: "演示脱敏合成；生产按 user_id RLS；service role 仅服务端" },
      { icon: icons.users, t: "人工门闩", d: "高风险须复核状态闭环，才进入最终底稿包叙事" },
      { icon: icons.shield, t: "可降级", d: "Kill switch / 规则-only：模型不可用仍出发现清单与骨架" },
      { icon: icons.eye, t: "可追溯", d: "规则集 · Prompt · 知识库版本写入报告元数据" },
    ];
    gov.forEach((g, i) => {
      const x = 0.5 + (i % 2) * 4.75;
      const y = 1.05 + Math.floor(i / 2) * 1.85;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x, y, w: 4.5, h: 1.65,
        fill: { color: C.white },
        shadow: shadow(),
        rectRadius: 0.1,
      });
      s.addShape(pres.shapes.OVAL, {
        x: x + 0.25, y: y + 0.45, w: 0.6, h: 0.6,
        fill: { color: C.ink },
      });
      s.addImage({ data: g.icon, x: x + 0.37, y: y + 0.57, w: 0.36, h: 0.36 });
      s.addText(g.t, {
        x: x + 1.1, y: y + 0.3, w: 3.1, h: 0.35,
        fontFace: "Arial", fontSize: 15, bold: true, color: C.text, margin: 0,
      });
      s.addText(g.d, {
        x: x + 1.1, y: y + 0.75, w: 3.15, h: 0.7,
        fontFace: "Arial", fontSize: 12, color: C.muted, margin: 0,
      });
    });
    s.addNotes(
      "40s：信安页。禁止用途——无复核不得对外披露发现，不得直接出具审计意见。边界越清楚越可信。"
    );
  }

  // ═══════════════ SLIDE 10 · Demo path ═══════════════
  {
    const s = pres.addSlide();
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 5.625, fill: { color: C.paper },
    });
    s.addText("现场演示 · 3 分钟一眼可信", {
      x: 0.55, y: 0.3, w: 9, h: 0.45,
      fontFace: "Arial", fontSize: 26, bold: true, color: C.text, margin: 0,
    });

    const demo = [
      { n: "1", t: "上传", d: "~3000 行费用明细\n脱敏合成数据" },
      { n: "2", t: "全量初筛", d: "规则引擎秒级\n四类费用红旗" },
      { n: "3", t: "四要素", d: "展开任一风险卡\n证据可回表" },
      { n: "4", t: "评测页", d: "/eval 甩数字\n人工 vs 系统" },
      { n: "5", t: "草稿底稿", d: "AI-assisted draft\n须项目组复核" },
    ];
    demo.forEach((d, i) => {
      const x = 0.4 + i * 1.9;
      s.addShape(pres.shapes.OVAL, {
        x: x + 0.55, y: 1.2, w: 0.65, h: 0.65,
        fill: { color: C.ink },
      });
      s.addText(d.n, {
        x: x + 0.55, y: 1.32, w: 0.65, h: 0.45,
        fontFace: "Arial", fontSize: 18, bold: true, color: C.gold,
        align: "center", margin: 0,
      });
      if (i < demo.length - 1) {
        s.addShape(pres.shapes.RIGHT_ARROW, {
          x: x + 1.45, y: 1.4, w: 0.3, h: 0.25,
          fill: { color: "C5CCD4" },
        });
      }
      s.addText(d.t, {
        x, y: 2.1, w: 1.8, h: 0.4,
        fontFace: "Arial", fontSize: 15, bold: true, color: C.text,
        align: "center", margin: 0,
      });
      s.addText(d.d, {
        x, y: 2.55, w: 1.8, h: 0.7,
        fontFace: "Arial", fontSize: 12, color: C.muted,
        align: "center", margin: 0,
      });
    });

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.55, y: 3.6, w: 8.9, h: 1.45,
      fill: { color: C.ink },
      rectRadius: 0.1,
    });
    s.addText("故障也是能力", {
      x: 0.9, y: 3.85, w: 8.2, h: 0.35,
      fontFace: "Arial", fontSize: 14, bold: true, color: C.gold, margin: 0,
    });
    s.addText("模型额度耗尽 → 规则-only 降级，硬检测不停 · 任务异常 → /demo/snapshot 官方兜底快照\n欢迎评委自带 CSV → /challenge 现场挑战模式", {
      x: 0.9, y: 4.3, w: 8.2, h: 0.55,
      fontFace: "Arial", fontSize: 13, color: C.white, margin: 0,
    });
    s.addNotes("25s：过渡 Demo。按 demo-script-ey.md 执行。翻车预案提前背。");
  }

  // ═══════════════ SLIDE 11 · Pilot ═══════════════
  {
    const s = pres.addSlide();
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 5.625, fill: { color: C.paper },
    });
    s.addText("落地路径 · 进项目组工具箱", {
      x: 0.55, y: 0.3, w: 9, h: 0.45,
      fontFace: "Arial", fontSize: 26, bold: true, color: C.text, margin: 0,
    });

    const phases = [
      { p: "P1 试点", t: "费用 / 报销循环", d: "一个项目组 · 初筛时效\n召回 · High 复核闭环" },
      { p: "P2 认证", t: "质量复核 + 工具认证", d: "系统卡 · 轨迹 · 权限\n规则版本治理" },
      { p: "P3 复制", t: "业务包扩展", d: "应付 · 薪酬 · 收入截止\n同一套 graph + 规则包" },
    ];
    phases.forEach((ph, i) => {
      const x = 0.5 + i * 3.15;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x, y: 1.15, w: 3.0, h: 3.5,
        fill: { color: i === 0 ? C.ink : C.white },
        shadow: shadow(),
        rectRadius: 0.1,
      });
      s.addText(ph.p, {
        x: x + 0.2, y: 1.45, w: 2.6, h: 0.35,
        fontFace: "Arial", fontSize: 12, bold: true,
        color: i === 0 ? C.gold : C.gold, margin: 0,
      });
      s.addText(ph.t, {
        x: x + 0.2, y: 2.0, w: 2.6, h: 0.7,
        fontFace: "Arial", fontSize: 18, bold: true,
        color: i === 0 ? C.white : C.text, margin: 0,
      });
      s.addText(ph.d, {
        x: x + 0.2, y: 2.9, w: 2.6, h: 1.2,
        fontFace: "Arial", fontSize: 13,
        color: i === 0 ? "B8C0C8" : C.muted, margin: 0,
      });
    });
    s.addNotes(
      "35s：不谈颠覆谈试点。要进的是项目组工具箱，不是年度创新展台。"
    );
  }

  // ═══════════════ SLIDE 12 · Close ═══════════════
  {
    const s = pres.addSlide();
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 5.625, fill: { color: C.ink },
    });
    s.addShape(pres.shapes.OVAL, {
      x: -1.5, y: 3.5, w: 3.5, h: 3.5,
      fill: { color: C.inkSoft },
    });
    s.addText("记住三件事", {
      x: 0.7, y: 0.55, w: 8, h: 0.45,
      fontFace: "Arial", fontSize: 14, bold: true, color: C.gold,
      charSpacing: 2, margin: 0,
    });

    const closes = [
      { n: "效率", d: "全量初筛：小时级翻表 → 秒级 / 分钟级" },
      { n: "可靠", d: "规则确定性 + 离线 Golden Set 数字" },
      { n: "可进底稿", d: "四要素可解释 + 人工门闩 + 可治理降级" },
    ];
    closes.forEach((c, i) => {
      s.addText(c.n, {
        x: 0.7, y: 1.3 + i * 0.85, w: 2.2, h: 0.45,
        fontFace: "Arial", fontSize: 22, bold: true, color: C.gold, margin: 0,
      });
      s.addText(c.d, {
        x: 3.0, y: 1.35 + i * 0.85, w: 6.2, h: 0.45,
        fontFace: "Arial", fontSize: 18, color: C.white, margin: 0,
      });
    });

    s.addText("人做判断  ·  系统做规模化执行", {
      x: 0.7, y: 4.35, w: 8.5, h: 0.4,
      fontFace: "Arial", fontSize: 16, italic: true, color: C.goldSoft, margin: 0,
    });
    s.addText("谢谢  ·  欢迎挑战：上传你们自己的 CSV", {
      x: 0.7, y: 4.9, w: 8.5, h: 0.3,
      fontFace: "Arial", fontSize: 13, color: "8A93A0", margin: 0,
    });
    s.addNotes(
      "30s 收尾：效率、可靠、可进底稿。赋能项目组。鞠躬，等提问。可用挑战模式接招。"
    );
  }

  // ═══════════════ SLIDE 13 · Appendix Q&A card ═══════════════
  {
    const s = pres.addSlide();
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 5.625, fill: { color: C.paper },
    });
    s.addText("附录 · 高频追问一页纸", {
      x: 0.55, y: 0.28, w: 9, h: 0.4,
      fontFace: "Arial", fontSize: 22, bold: true, color: C.text, margin: 0,
    });

    const qa = [
      ["能进项目组吗？", "协审初筛 + draft；须 Review；边界写在 UI / 系统卡"],
      ["和 ChatGPT？", "规则确定性 · 四要素 · Golden Set · RLS · 降级"],
      ["会幻觉吗？", "硬风险不由 LLM 新增；无证据无结论；门禁评测"],
      ["误报？", "阈值可配 · 规则版本化 · 负例进回归集"],
      ["数据安全？", "演示脱敏 · 生产 RLS · 密钥仅服务端"],
      ["法律责任？", "不替代签字 · 禁止无复核披露 · 不出审计意见"],
    ];
    qa.forEach((row, i) => {
      const y = 0.85 + i * 0.72;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: 0.55, y, w: 8.9, h: 0.62,
        fill: { color: C.white },
        shadow: shadow(),
        rectRadius: 0.06,
      });
      s.addText(row[0], {
        x: 0.75, y: y + 0.14, w: 2.4, h: 0.35,
        fontFace: "Arial", fontSize: 13, bold: true, color: C.gold, margin: 0,
      });
      s.addText(row[1], {
        x: 3.2, y: y + 0.14, w: 6.0, h: 0.35,
        fontFace: "Arial", fontSize: 13, color: C.text, margin: 0,
      });
    });
    s.addNotes("备用页：被追问时翻到此页，按表应答 ≤20 秒。");
  }

  const out = path.join(__dirname, "AuditDraft-EY-Pitch.pptx");
  await pres.writeFile({ fileName: out });
  console.log("Wrote", out);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
