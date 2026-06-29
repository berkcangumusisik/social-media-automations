import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTranslator, resolveLang, SUPPORTED_LANGS } from '../src/utils/i18n.js';

test('resolveLang falls back to en for unknown languages', () => {
  assert.equal(resolveLang('tr'), 'tr');
  assert.equal(resolveLang('en'), 'en');
  assert.equal(resolveLang('de'), 'en');
  assert.equal(resolveLang(undefined), 'en');
});

test('translator interpolates variables', () => {
  const t = createTranslator('en');
  assert.equal(t('generate.done', { path: 'out/x.mp4' }), 'Done. Output: out/x.mp4');
});

test('turkish translations differ from english', () => {
  const en = createTranslator('en');
  const tr = createTranslator('tr');
  assert.notEqual(en('platforms.title'), tr('platforms.title'));
});

test('supported langs include tr and en', () => {
  assert.deepEqual([...SUPPORTED_LANGS].sort(), ['en', 'tr']);
});
