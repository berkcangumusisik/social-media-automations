// Orchestrates a single generation: resolve platform and template, decide the
// content (Claude Code or config text), let the template build the FFmpeg plan,
// run it, and write the caption sidecar file.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, basename, extname } from 'node:path';
import { getPlatform } from '../platforms/index.js';
import { getTemplate, assertSupports } from '../templates/index.js';
import { validateConfig } from '../config/validate.js';
import { generateContent } from '../claude/content.js';
import { captionFileBody } from '../claude/schema.js';
import { compose } from '../render/compose.js';
import { runFfmpeg, ensureFfmpeg, quoteCommand } from '../ffmpeg/runner.js';
import { logger } from '../utils/logger.js';

function contentFromConfig(config) {
  return {
    idea: '',
    hook: config.title || '',
    title: config.title || '',
    onScreenText: config.onScreenText || '',
    subtitles: config.subtitles || [],
    caption: config.caption || '',
    hashtags: Array.isArray(config.hashtags) ? config.hashtags : [],
    musicMood: config.musicMood || '',
    cta: config.cta || '',
  };
}

function defaultOutput(platform) {
  const ext = platform.container || (platform.kind === 'image' ? 'jpg' : 'mp4');
  return join('out', `${platform.id}.${ext}`);
}

export async function generate({ platformId, templateName, config, output, noAi, dryRun, t }) {
  const platform = getPlatform(platformId);
  const template = getTemplate(templateName);
  assertSupports(template, platformId);

  const normalized = validateConfig(config, { platform });

  // Decide content source.
  let content;
  let mode = 'config';
  const useAi = !noAi && !!normalized.ai;
  if (useAi) {
    logger.info(t('generate.claudeStart'));
    const res = await generateContent({ platform, config: normalized, t });
    content = res.content;
    mode = res.mode;
    logger.info(t('generate.aiMode', { mode }));
  } else {
    if (!noAi && !normalized.ai) {
      // No ai block and not explicitly --no-ai: just use config text.
    }
    content = contentFromConfig(normalized);
  }

  const outputPath = output || normalized.output || defaultOutput(platform);
  mkdirSync(dirname(outputPath) || '.', { recursive: true });

  const workdir = mkdtempSync(join(tmpdir(), 'social-auto-'));
  const ctx = {
    preset: platform,
    content,
    config: normalized,
    duration: normalized.duration,
    outputPath,
    workdir,
  };

  const plan = template.buildPlan(ctx);
  const args = await compose(ctx, plan);
  const command = quoteCommand(args);

  if (dryRun) {
    // Keep the temp dir so the rendered overlays and printed command stay valid.
    return { dryRun: true, command, outputPath, mode };
  }

  ensureFfmpeg();
  logger.info(t('generate.rendering'));
  try {
    await runFfmpeg(args);
  } finally {
    rmSync(workdir, { recursive: true, force: true });
  }

  // Caption sidecar.
  let captionPath = null;
  if (content.caption || content.hashtags?.length || content.cta) {
    const base = basename(outputPath, extname(outputPath));
    captionPath = join(dirname(outputPath) || '.', `${base}.caption.txt`);
    writeFileSync(captionPath, captionFileBody(content), 'utf8');
  }

  return { dryRun: false, command, outputPath, captionPath, mode, content };
}
