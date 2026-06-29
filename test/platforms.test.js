import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listPlatforms, getPlatform, hasPlatform, safeBox } from '../src/platforms/index.js';

test('registry exposes the expected platforms', () => {
  const ids = listPlatforms().map((p) => p.id);
  for (const id of ['tiktok', 'instagram-reels', 'youtube-shorts', 'instagram-post', 'linkedin-post', 'x-post', 'facebook-post']) {
    assert.ok(ids.includes(id), `missing platform ${id}`);
  }
});

test('getPlatform returns a preset, unknown throws', () => {
  const tiktok = getPlatform('tiktok');
  assert.equal(tiktok.width, 1080);
  assert.equal(tiktok.height, 1920);
  assert.ok(tiktok.safeArea);
  assert.throws(() => getPlatform('nope'), /Unknown platform/);
});

test('hasPlatform reflects membership', () => {
  assert.equal(hasPlatform('tiktok'), true);
  assert.equal(hasPlatform('myspace'), false);
});

test('safeBox stays inside the frame', () => {
  const box = safeBox(getPlatform('tiktok'));
  assert.ok(box.x >= 0 && box.y >= 0);
  assert.ok(box.x + box.w <= 1080);
  assert.ok(box.y + box.h <= 1920);
});
