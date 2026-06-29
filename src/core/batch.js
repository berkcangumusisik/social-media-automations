// Batch generation. A batch file lists jobs, each pointing at a config file and
// choosing a platform and template. Jobs run sequentially to keep CPU and FFmpeg
// usage predictable.
//
// Batch file shape (JSON or YAML):
//   {
//     "jobs": [
//       { "platform": "tiktok", "template": "hook-subtitle",
//         "config": "tiktok.json", "output": "out/a.mp4", "noAi": false }
//     ]
//   }

import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, isAbsolute } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { loadConfig } from '../config/loader.js';
import { generate } from './generator.js';
import { ConfigError } from '../utils/errors.js';

export async function runBatch({ batchPath, dryRun, t }) {
  if (!existsSync(batchPath)) {
    throw new ConfigError(`Batch file not found: ${batchPath}`);
  }
  const raw = readFileSync(batchPath, 'utf8');
  const data = /\.ya?ml$/i.test(batchPath) ? parseYaml(raw) : JSON.parse(raw);
  if (!data || !Array.isArray(data.jobs)) {
    throw new ConfigError('Batch file must have a "jobs" array.');
  }
  const base = dirname(resolve(batchPath));
  const results = [];

  for (const [i, job] of data.jobs.entries()) {
    if (!job.platform || !job.template || !job.config) {
      throw new ConfigError(`Batch job ${i + 1} needs platform, template and config.`);
    }
    const configPath = isAbsolute(job.config) ? job.config : resolve(base, job.config);
    const config = loadConfig(configPath);
    const output = job.output
      ? isAbsolute(job.output)
        ? job.output
        : resolve(base, job.output)
      : undefined;

    const res = await generate({
      platformId: job.platform,
      templateName: job.template,
      config,
      output,
      noAi: !!job.noAi,
      dryRun,
      t,
    });
    results.push({ job: i + 1, ...res });
  }
  return results;
}
