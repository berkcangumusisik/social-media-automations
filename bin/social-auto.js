#!/usr/bin/env node
// Entry point. Runs the CLI and turns typed AppErrors into clean messages with
// a meaningful exit code.

import { run } from '../src/cli.js';
import { AppError } from '../src/utils/errors.js';
import { logger } from '../src/utils/logger.js';

run().catch((err) => {
  if (err instanceof AppError) {
    logger.error(err.message);
    process.exit(err.exitCode || 1);
  }
  logger.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});
