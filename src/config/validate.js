// Validate and normalize a loaded config. Errors are collected and reported
// together so a user sees every problem at once, not one per run.

import { ConfigError } from '../utils/errors.js';

const LANGS = new Set(['tr', 'en']);

export function validateConfig(config, { platform } = {}) {
  const errors = [];
  const normalized = { ...config };

  // Duration.
  if (normalized.duration === undefined) {
    normalized.duration = platform && platform.kind === 'video' ? 15 : 0;
  } else if (typeof normalized.duration !== 'number' || normalized.duration < 0) {
    errors.push('duration must be a non-negative number (seconds).');
  }
  if (platform && platform.kind === 'video' && platform.maxDuration) {
    if (normalized.duration > platform.maxDuration) {
      errors.push(
        `duration ${normalized.duration}s exceeds the ${platform.label} limit of ${platform.maxDuration}s.`
      );
    }
  }

  // AI block.
  if (normalized.ai) {
    if (typeof normalized.ai !== 'object') {
      errors.push('ai must be an object.');
    } else {
      const ai = normalized.ai;
      if (ai.language && !LANGS.has(String(ai.language).toLowerCase())) {
        errors.push(`ai.language must be one of: ${[...LANGS].join(', ')}.`);
      }
      if (ai.research && !ai.topic && !ai.brief && !ai.niche) {
        errors.push('ai.research is true but no ai.topic, ai.brief or ai.niche was given to research.');
      }
    }
  }

  // Subtitles shape (when provided directly, without AI).
  if (normalized.subtitles && !Array.isArray(normalized.subtitles) && typeof normalized.subtitles !== 'string') {
    errors.push('subtitles must be an array or a string.');
  }

  // Music volume.
  if (normalized.music && normalized.music.volume !== undefined) {
    const v = normalized.music.volume;
    if (typeof v !== 'number' || v < 0 || v > 2) {
      errors.push('music.volume must be a number between 0 and 2.');
    }
  }

  if (errors.length) {
    throw new ConfigError(`Config has problems:\n - ${errors.join('\n - ')}`);
  }
  return normalized;
}

// Decide which content mode the config implies.
export function contentMode(config) {
  const ai = config.ai || {};
  if (ai.research && (ai.topic || ai.brief || ai.niche)) return 'research';
  if (ai.brief) return 'brief';
  return 'viral';
}
