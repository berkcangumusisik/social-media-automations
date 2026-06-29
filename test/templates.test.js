import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { listTemplates, getTemplate, assertSupports } from '../src/templates/index.js';
import { getPlatform } from '../src/platforms/index.js';
import { composeVideo, composeImage } from '../src/render/compose.js';

function fakeCtx(overrides = {}) {
  return {
    preset: getPlatform('tiktok'),
    content: {
      title: 'Big hook line',
      hook: 'Big hook line',
      subtitles: [
        { text: 'line one', start: 0, end: 2 },
        { text: 'line two', start: 2, end: 4 },
      ],
      caption: 'a caption',
      onScreenText: '',
    },
    config: { input: { background: '#101418' } },
    duration: 8,
    outputPath: '/tmp/out.mp4',
    workdir: mkdtempSync(join(tmpdir(), 'sa-tpl-')),
    ...overrides,
  };
}

test('registry exposes 4+ video templates and the image card', () => {
  const names = listTemplates().map((t) => t.name);
  for (const n of ['hook-subtitle', 'clean-caption', 'bold-center', 'word-pop', 'image-card']) {
    assert.ok(names.includes(n), `missing template ${n}`);
  }
  assert.ok(listTemplates().filter((t) => t.kind === 'video').length >= 4);
});

test('video templates produce overlays with placed text blocks', () => {
  for (const name of ['hook-subtitle', 'clean-caption', 'bold-center', 'word-pop']) {
    const plan = getTemplate(name).buildPlan(fakeCtx());
    assert.equal(plan.kind, 'video', `${name} kind`);
    assert.ok(plan.overlays.length > 0, `${name} has overlays`);
    const block = plan.overlays[0].blocks[0];
    assert.ok(block.text, `${name} overlay has text`);
    assert.ok(Number.isFinite(block.fontPx), `${name} overlay has fontPx`);
    // Blocks must sit inside the frame.
    assert.ok(block.x >= 0 && block.y >= 0 && block.x + block.w <= 1080);
  }
});

test('image-card produces a still image plan', () => {
  const ctx = fakeCtx({ preset: getPlatform('linkedin-post'), outputPath: '/tmp/card.jpg' });
  const plan = getTemplate('image-card').buildPlan(ctx);
  assert.equal(plan.kind, 'image');
  assert.ok(plan.overlays.length > 0);
});

test('composeVideo renders overlays and builds an FFmpeg arg list', async () => {
  const ctx = fakeCtx();
  const plan = getTemplate('hook-subtitle').buildPlan(ctx);
  const args = await composeVideo(ctx, plan.overlays);
  assert.ok(args.includes('-filter_complex'));
  assert.ok(args.includes('-map'));
  assert.equal(args.at(-1), '/tmp/out.mp4');
  const fc = args[args.indexOf('-filter_complex') + 1];
  assert.ok(fc.includes('overlay=0:0'), 'uses overlay filter');
  assert.ok(fc.includes('[v]'), 'final video label');
});

test('composeImage builds a single-frame arg list', async () => {
  const ctx = fakeCtx({ preset: getPlatform('linkedin-post'), outputPath: '/tmp/card.jpg' });
  const plan = getTemplate('image-card').buildPlan(ctx);
  const args = await composeImage(ctx, plan.overlays);
  assert.ok(args.includes('-frames:v'));
  assert.equal(args.at(-1), '/tmp/card.jpg');
});

test('assertSupports rejects an unsupported platform', () => {
  assert.throws(() => assertSupports(getTemplate('hook-subtitle'), 'linkedin-post'), /does not support/);
  assert.doesNotThrow(() => assertSupports(getTemplate('hook-subtitle'), 'tiktok'));
});
