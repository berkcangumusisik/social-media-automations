import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadConfig } from '../src/config/loader.js';
import { validateConfig, contentMode } from '../src/config/validate.js';
import { getPlatform } from '../src/platforms/index.js';

function tmpFile(name, body) {
  const dir = mkdtempSync(join(tmpdir(), 'sa-cfg-'));
  const path = join(dir, name);
  writeFileSync(path, body, 'utf8');
  return path;
}

test('loadConfig parses JSON and resolves relative asset paths', () => {
  const path = tmpFile('c.json', JSON.stringify({ input: { video: 'clip.mp4' }, output: 'out/x.mp4' }));
  const cfg = loadConfig(path);
  assert.ok(cfg.input.video.endsWith('clip.mp4'));
  assert.ok(cfg.input.video.startsWith('/'), 'should be absolute');
  assert.ok(cfg.output.endsWith('out/x.mp4'));
});

test('loadConfig parses YAML', () => {
  const path = tmpFile('c.yaml', 'duration: 12\nai:\n  niche: test\n');
  const cfg = loadConfig(path);
  assert.equal(cfg.duration, 12);
  assert.equal(cfg.ai.niche, 'test');
});

test('validateConfig fills duration default for video', () => {
  const cfg = validateConfig({}, { platform: getPlatform('tiktok') });
  assert.equal(cfg.duration, 15);
});

test('validateConfig rejects duration over the platform limit', () => {
  assert.throws(
    () => validateConfig({ duration: 999 }, { platform: getPlatform('tiktok') }),
    /exceeds/
  );
});

test('validateConfig rejects bad music volume', () => {
  assert.throws(() => validateConfig({ music: { volume: 9 } }), /music.volume/);
});

test('contentMode detects research, brief and viral', () => {
  assert.equal(contentMode({ ai: { topic: 't', research: true } }), 'research');
  assert.equal(contentMode({ ai: { brief: 'b' } }), 'brief');
  assert.equal(contentMode({ ai: { niche: 'n' } }), 'viral');
  assert.equal(contentMode({}), 'viral');
});
