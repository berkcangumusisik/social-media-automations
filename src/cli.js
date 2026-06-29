// CLI surface built on commander. User-facing results go to stdout; progress and
// errors go to stderr (via the logger), so output like --dry-run stays clean.

import { Command } from 'commander';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { listPlatforms, getPlatform } from './platforms/index.js';
import { listTemplates } from './templates/index.js';
import { loadConfig } from './config/loader.js';
import { generate } from './core/generator.js';
import { runBatch } from './core/batch.js';
import { generateIdeas } from './claude/content.js';
import { buildDemoAssets } from './ffmpeg/demo-assets.js';
import { createTranslator } from './utils/i18n.js';
import { logger } from './utils/logger.js';
import { ConfigError } from './utils/errors.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

function setVerbose(opts) {
  if (opts.verbose) logger.setLevel('debug');
}

export function buildProgram() {
  const program = new Command();
  program
    .name('social-auto')
    .description('Write social content with Claude Code and render it with FFmpeg.')
    .version(pkg.version);

  program
    .command('generate')
    .description('Generate content for a platform and render it.')
    .option('-p, --platform <id>', 'platform id (see list-platforms)')
    .option('-t, --template <name>', 'template name (see list-templates)')
    .option('-c, --config <file>', 'content config (JSON or YAML)')
    .option('-b, --batch <file>', 'batch file with multiple jobs')
    .option('-o, --output <file>', 'output path override')
    .option('-l, --lang <code>', 'CLI language (en or tr)')
    .option('--dry-run', 'print the FFmpeg command without running it')
    .option('--no-ai', 'skip Claude, use text from the config')
    .option('--verbose', 'verbose logging')
    .action(async (opts) => {
      setVerbose(opts);
      const noAi = opts.ai === false;

      if (opts.batch) {
        const t = createTranslator(opts.lang);
        const results = await runBatch({ batchPath: resolve(opts.batch), dryRun: opts.dryRun, t });
        for (const r of results) {
          if (r.dryRun) {
            logger.info(t('generate.dryRun'));
            console.log(r.command);
          } else {
            logger.info(t('generate.done', { path: r.outputPath }));
            if (r.captionPath) logger.info(t('generate.caption', { path: r.captionPath }));
          }
        }
        return;
      }

      if (!opts.platform || !opts.template) {
        throw new ConfigError('generate needs --platform and --template (or use --batch).');
      }
      if (!opts.config) {
        const t = createTranslator(opts.lang);
        throw new ConfigError(t('error.configMissing'));
      }

      const config = loadConfig(resolve(opts.config));
      const lang = opts.lang || config.ai?.language;
      const t = createTranslator(lang);

      logger.info(t('generate.start', { platform: opts.platform, template: opts.template }));
      if (noAi) logger.info(t('generate.aiSkip'));

      const res = await generate({
        platformId: opts.platform,
        templateName: opts.template,
        config,
        output: opts.output,
        noAi,
        dryRun: opts.dryRun,
        t,
      });

      if (res.dryRun) {
        logger.info(t('generate.dryRun'));
        console.log(res.command);
      } else {
        logger.info(t('generate.done', { path: res.outputPath }));
        if (res.captionPath) logger.info(t('generate.caption', { path: res.captionPath }));
      }
    });

  program
    .command('ideate')
    .description('Brainstorm content ideas with Claude Code (no rendering).')
    .requiredOption('-p, --platform <id>', 'platform id')
    .option('-n, --niche <text>', 'niche to brainstorm around')
    .option('--topic <text>', 'topic to research')
    .option('--research', 'let Claude research the topic on the web')
    .option('--count <n>', 'how many ideas', '5')
    .option('-l, --lang <code>', 'content language (en or tr)')
    .option('-m, --model <id>', 'Claude model id')
    .option('--verbose', 'verbose logging')
    .action(async (opts) => {
      setVerbose(opts);
      const t = createTranslator(opts.lang);
      const platform = getPlatform(opts.platform);
      const count = Math.max(1, Math.min(20, parseInt(opts.count, 10) || 5));
      const ai = {
        niche: opts.niche,
        topic: opts.topic,
        language: opts.lang,
        model: opts.model,
      };
      logger.info(t('ideate.start', { count, platform: platform.label }));
      const ideas = await generateIdeas({
        platform,
        ai,
        count,
        research: !!opts.research,
        t,
      });
      ideas.forEach((idea, i) => {
        console.log(`\n${i + 1}. ${idea.idea}`);
        if (idea.hook) console.log(`   hook: ${idea.hook}`);
        if (idea.caption) console.log(`   caption: ${idea.caption}`);
        if (idea.hashtags?.length) console.log(`   ${idea.hashtags.join(' ')}`);
      });
      logger.info(t('ideate.done'));
    });

  program
    .command('list-platforms')
    .description('List available platform presets.')
    .option('-l, --lang <code>', 'CLI language (en or tr)')
    .action((opts) => {
      const t = createTranslator(opts.lang);
      console.log(t('platforms.title'));
      for (const p of listPlatforms()) {
        const dims = p.kind === 'video' ? `${p.width}x${p.height} @${p.fps}fps` : `${p.width}x${p.height}`;
        console.log(`  ${p.id.padEnd(18)} ${p.label.padEnd(20)} ${p.kind.padEnd(6)} ${dims}`);
      }
    });

  program
    .command('list-templates')
    .description('List available templates.')
    .option('-l, --lang <code>', 'CLI language (en or tr)')
    .action((opts) => {
      const t = createTranslator(opts.lang);
      console.log(t('templates.title'));
      for (const tpl of listTemplates()) {
        console.log(`  ${tpl.name.padEnd(16)} ${tpl.kind.padEnd(6)} ${tpl.description}`);
        console.log(`  ${''.padEnd(16)} ${''.padEnd(6)} supports: ${tpl.supports.join(', ')}`);
      }
    });

  program
    .command('init-demo')
    .description('Create synthetic demo assets so the examples run without media.')
    .option('-l, --lang <code>', 'CLI language (en or tr)')
    .action(async (opts) => {
      const t = createTranslator(opts.lang);
      const dir = resolve('examples/assets');
      logger.info(t('initDemo.start'));
      await buildDemoAssets(dir);
      logger.info(t('initDemo.done', { dir }));
    });

  return program;
}

export async function run(argv = process.argv) {
  const program = buildProgram();
  await program.parseAsync(argv);
}
