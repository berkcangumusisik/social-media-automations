// Load a content config from JSON or YAML. Relative asset paths (input.video,
// music.path, logo.path, font, output) are resolved against the config file's
// own directory, so example configs can point at local files naturally.

import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, isAbsolute } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { ConfigError } from '../utils/errors.js';

function resolveMaybe(base, value) {
  if (!value || typeof value !== 'string') return value;
  return isAbsolute(value) ? value : resolve(base, value);
}

export function loadConfig(path) {
  if (!existsSync(path)) {
    throw new ConfigError(`Config file not found: ${path}`);
  }
  const raw = readFileSync(path, 'utf8');
  let data;
  try {
    data = /\.ya?ml$/i.test(path) ? parseYaml(raw) : JSON.parse(raw);
  } catch (err) {
    throw new ConfigError(`Could not parse config ${path}: ${err.message}`, { cause: err });
  }
  if (!data || typeof data !== 'object') {
    throw new ConfigError(`Config ${path} must be an object.`);
  }

  const base = dirname(resolve(path));
  if (data.input) {
    data.input.video = resolveMaybe(base, data.input.video);
    data.input.image = resolveMaybe(base, data.input.image);
  }
  if (data.music) data.music.path = resolveMaybe(base, data.music.path);
  if (data.logo) data.logo.path = resolveMaybe(base, data.logo.path);
  data.font = resolveMaybe(base, data.font);
  if (data.subtitlesSrt) data.subtitlesSrt = resolveMaybe(base, data.subtitlesSrt);
  if (data.output) data.output = resolveMaybe(base, data.output);

  data.__base = base;
  return data;
}
