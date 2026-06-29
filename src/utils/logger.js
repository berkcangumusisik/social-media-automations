// Small leveled logger. No dependencies, writes to stderr so that
// machine-readable output (for example --dry-run) can stay on stdout.

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 99 };

const COLORS = {
  debug: '\x1b[90m',
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  reset: '\x1b[0m',
};

function useColor() {
  return process.stderr.isTTY && !process.env.NO_COLOR;
}

export function createLogger({ level = 'info' } = {}) {
  let threshold = LEVELS[level] ?? LEVELS.info;

  function emit(lvl, args) {
    if (LEVELS[lvl] < threshold) return;
    const tag = useColor() ? `${COLORS[lvl]}${lvl}${COLORS.reset}` : lvl;
    process.stderr.write(`[${tag}] ${args.join(' ')}\n`);
  }

  return {
    setLevel(next) {
      threshold = LEVELS[next] ?? threshold;
    },
    debug: (...a) => emit('debug', a),
    info: (...a) => emit('info', a),
    warn: (...a) => emit('warn', a),
    error: (...a) => emit('error', a),
  };
}

export const logger = createLogger({
  level: process.env.SOCIAL_AUTO_LOG || 'info',
});
