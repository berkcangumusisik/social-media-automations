// Platform registry. Wraps the preset list with lookup helpers.

import { PRESETS } from './presets.js';
import { PlatformError } from '../utils/errors.js';

const registry = new Map();
for (const preset of PRESETS) {
  registry.set(preset.id, preset);
}

export function listPlatforms() {
  return [...registry.values()];
}

export function getPlatform(id) {
  const preset = registry.get(id);
  if (!preset) {
    throw new PlatformError(`Unknown platform: ${id}`, { code: 'UNKNOWN_PLATFORM' });
  }
  return preset;
}

export function hasPlatform(id) {
  return registry.has(id);
}

// Pixel-space safe-area box derived from the preset fractions.
export function safeBox(preset) {
  const sa = preset.safeArea || { top: 0.05, bottom: 0.05, left: 0.05, right: 0.05 };
  const x = Math.round(preset.width * sa.left);
  const y = Math.round(preset.height * sa.top);
  const w = Math.round(preset.width * (1 - sa.left - sa.right));
  const h = Math.round(preset.height * (1 - sa.top - sa.bottom));
  return { x, y, w, h };
}
