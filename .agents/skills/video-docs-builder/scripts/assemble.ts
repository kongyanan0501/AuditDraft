/**
 * Assembles the final video by overlaying all narration audio tracks
 * onto the recorded Playwright video at their correct timestamps.
 *
 * Uses FFmpeg filter_complex with adelay to position each audio track.
 *
 * Usage: tsx src/assemble.ts projects/demo-app/flows/06-feature-demo.enriched.json
 */
import { execSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { Flow, FlowStep } from './types.js';
import { projectRootFromFlow, detectLangFromFlow, projectPaths } from './paths.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function checkFFmpeg(): void {
  const result = spawnSync('ffmpeg', ['-version'], { encoding: 'utf-8' });
  if (result.error) {
    console.error('❌ ffmpeg not found. Install with: brew install ffmpeg');
    process.exit(1);
  }
}

function buildFilterComplex(audioSteps: FlowStep[]): { inputs: string[]; filter: string } {
  const inputs: string[] = [];
  const labels: string[] = [];

  audioSteps.forEach((step, i) => {
    const delayMs = step.audio_start_ms ?? 0;
    inputs.push(`-i "${step.audio_file!}"`);
    labels.push(`[${i + 1}:a]adelay=${delayMs}|${delayMs}[a${i}]`);
  });

  const mixInputs = audioSteps.map((_, i) => `[a${i}]`).join('');
  const mix = `${mixInputs}amix=inputs=${audioSteps.length}:duration=longest:normalize=0[aout]`;

  const filter = [...labels, mix].join('; ');
  return { inputs, filter };
}

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0');
}

function msToSrtTime(ms: number): string {
  const clamped = Math.max(0, Math.floor(ms));
  const h = Math.floor(clamped / 3_600_000);
  const m = Math.floor((clamped % 3_600_000) / 60_000);
  const s = Math.floor((clamped % 60_000) / 1000);
  const milli = clamped % 1000;
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(milli, 3)}`;
}

const isAsciiWord = (ch: string) => /[A-Za-z0-9._-]/.test(ch);
const isBreakPunct = (ch: string) => /[，。；、！？,.!?;:\s]/.test(ch);

/** Soft-wrap captions; prefer punctuation; never split ASCII words mid-token. */
function wrapCaption(text: string, maxChars = 22): string {
  const chars = [...text.trim()];
  if (chars.length <= maxChars) return chars.join('');
  const lines: string[] = [];
  let i = 0;
  while (i < chars.length && lines.length < 3) {
    const remaining = chars.length - i;
    if (remaining <= maxChars || lines.length === 2) {
      lines.push(chars.slice(i).join(''));
      break;
    }
    const softMin = i + Math.floor(maxChars * 0.55);
    const hardMax = Math.min(chars.length, i + maxChars + 8);
    let breakAt = -1;
    for (let j = hardMax - 1; j >= softMin; j--) {
      if (isBreakPunct(chars[j]!)) {
        breakAt = j + 1;
        break;
      }
    }
    if (breakAt < 0) {
      breakAt = Math.min(i + maxChars, chars.length);
      // If mid ASCII word, finish the token when short; else retreat to word start.
      if (breakAt < chars.length && isAsciiWord(chars[breakAt]!)) {
        let end = breakAt;
        while (end < chars.length && isAsciiWord(chars[end]!)) end++;
        if (end - i <= maxChars + 12) breakAt = end;
        else {
          while (breakAt > softMin && isAsciiWord(chars[breakAt - 1]!)) breakAt--;
        }
      } else if (breakAt > 0 && isAsciiWord(chars[breakAt - 1]!)) {
        let start = breakAt;
        while (start > softMin && isAsciiWord(chars[start - 1]!)) start--;
        if (start > i) breakAt = start;
      }
    }
    lines.push(chars.slice(i, breakAt).join('').trimEnd());
    i = breakAt;
    while (i < chars.length && /\s/.test(chars[i]!)) i++;
  }
  return lines.join('\n');
}

function writeSrt(audioSteps: FlowStep[], srtPath: string): void {
  const blocks: string[] = [];
  let idx = 1;
  for (const step of audioSteps) {
    if (!step.narration) continue;
    const start = step.audio_start_ms ?? 0;
    const end = start + (step.audio_duration_ms ?? 2000);
    blocks.push(
      [
        String(idx++),
        `${msToSrtTime(start)} --> ${msToSrtTime(end)}`,
        wrapCaption(step.narration),
        '',
      ].join('\n'),
    );
  }
  fs.writeFileSync(srtPath, blocks.join('\n'), 'utf-8');
}

/** Escape path for ffmpeg subtitles= filter (macOS/Linux). */
function escapeSubtitlesPath(p: string): string {
  return p
    .replace(/\\/g, '/')
    .replace(/:/g, '\\:')
    .replace(/'/g, "\\'")
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');
}

async function main(): Promise<void> {
  const enrichedFlowPath = process.argv[2];
  if (!enrichedFlowPath) {
    console.error('Usage: tsx src/assemble.ts <flow.enriched.json>');
    process.exit(1);
  }

  checkFFmpeg();

  const flow = JSON.parse(fs.readFileSync(enrichedFlowPath, 'utf-8')) as Flow;
  const lang = detectLangFromFlow(enrichedFlowPath);
  const root = projectRootFromFlow(enrichedFlowPath);
  const paths = projectPaths(root, flow.output_name, lang);
  const finalDir = paths.final!;
  fs.mkdirSync(finalDir, { recursive: true });

  const videoPath = path.join(paths.raw!, `${flow.output_name}.webm`);
  if (!fs.existsSync(videoPath)) {
    const rawDir = paths.raw!;
    const webms = fs.readdirSync(rawDir).filter(f => f.endsWith('.webm'));
    if (webms.length === 0) {
      console.error(`❌ No video found in ${rawDir}. Run generate-video first.`);
      process.exit(1);
    }
    // Use most recent
    webms.sort();
    const found = path.join(rawDir, webms[webms.length - 1]);
    fs.renameSync(found, videoPath);
    console.log(`   Renamed ${found} → ${videoPath}`);
  }

  const audioSteps = flow.steps.filter(s => s.audio_file && s.audio_duration_ms);

  if (audioSteps.length === 0) {
    console.error('❌ No audio steps found. Run generate-audio first.');
    process.exit(1);
  }

  const finalPath = path.join(finalDir, `${flow.output_name}.mp4`);
  const trimMs = flow.trim_start_ms ?? 0;
  const trimSec = trimMs / 1000;

  console.log(`🎞  Assembling: "${flow.title}"`);
  console.log(`   Video: ${videoPath}`);
  console.log(`   Audio tracks: ${audioSteps.length}`);
  if (trimMs > 0) console.log(`   ✂️  Trimming first ${trimSec.toFixed(1)}s (login section)`);
  console.log(`   Output: ${finalPath}`);

  // audio_start_ms is measured from Phase 2 start (after setup), so it's already
  // relative to the trimmed video. No adjustment needed — -ss handles the trim.
  const { inputs, filter: audioFilter } = buildFilterComplex(audioSteps);

  const srtPath = path.join(finalDir, `${flow.output_name}.srt`);
  writeSrt(audioSteps, srtPath);
  console.log(`   Subtitles: ${srtPath}`);

  const fontName =
    process.env.SUBTITLE_FONT ??
    (process.platform === 'darwin' ? 'PingFang SC' : 'Noto Sans CJK SC');
  const srtForFilter = escapeSubtitlesPath(srtPath);
  // Bottom-centered burn-in captions
  const forceStyle = [
    `FontName=${fontName}`,
    'FontSize=20',
    'PrimaryColour=&H00FFFFFF&',
    'OutlineColour=&H80000000&',
    'BackColour=&H80000000&',
    'BorderStyle=3',
    'Outline=1',
    'Shadow=0',
    'Alignment=2',
    'MarginV=42',
  ].join(',');
  const videoFilter = `[0:v]subtitles='${srtForFilter}':force_style='${forceStyle}'[vout]`;
  const filterComplex = `${videoFilter}; ${audioFilter}`;

  // Playwright webm often lacks duration; +genpts + CFR + no B-frames
  // keeps QuickTime / IDE previews from freezing on the first frame.
  const videoEncode = [
    '-c:v libx264 -preset fast -crf 23',
    '-pix_fmt yuv420p -profile:v high -level 4.0',
    '-bf 0 -vsync cfr -r 25',
    '-movflags +faststart',
  ].join(' ');
  const audioEncode = '-c:a aac -b:a 128k -ar 48000';

  const audioInputsStr = inputs.join(' ');
  const cmd = [
    'ffmpeg -y',
    '-fflags +genpts',
    trimMs > 0 ? `-ss ${trimSec.toFixed(3)}` : '',
    `-i "${videoPath}"`,
    audioInputsStr,
    `-filter_complex "${filterComplex}"`,
    '-map "[vout]"',
    '-map "[aout]"',
    videoEncode,
    audioEncode,
    '-shortest',
    `"${finalPath}"`,
  ].join(' ');

  console.log(`\n   Running FFmpeg (with burned-in subtitles)...`);
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch {
    console.warn('⚠️  Subtitle burn-in failed; retrying without subtitles...');
    const fallback = [
      'ffmpeg -y',
      '-fflags +genpts',
      trimMs > 0 ? `-ss ${trimSec.toFixed(3)}` : '',
      `-i "${videoPath}"`,
      audioInputsStr,
      `-filter_complex "${audioFilter}"`,
      '-map 0:v',
      '-map "[aout]"',
      videoEncode,
      audioEncode,
      '-shortest',
      `"${finalPath}"`,
    ].join(' ');
    execSync(fallback, { stdio: 'inherit' });
  }

  const stats = fs.statSync(finalPath);
  const sizeMb = (stats.size / 1024 / 1024).toFixed(1);

  console.log(`\n✅ Final video: ${finalPath} (${sizeMb} MB)`);

  // Also output a thumbnail
  const thumbPath = path.join(finalDir, `${flow.output_name}-thumb.jpg`);
  try {
    execSync(
      `ffmpeg -y -i "${finalPath}" -ss 00:00:05 -vframes 1 -q:v 2 "${thumbPath}"`,
      { stdio: 'pipe' }
    );
    console.log(`   Thumbnail: ${thumbPath}`);
  } catch {
    // Non-critical
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
