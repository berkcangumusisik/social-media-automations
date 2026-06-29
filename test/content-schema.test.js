import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeContentPackage, stripDashes, captionFileBody } from '../src/claude/schema.js';
import { extractJson } from '../src/claude/runner.js';

test('stripDashes removes em and en dashes', () => {
  assert.equal(stripDashes('a — b'), 'a, b');
  assert.equal(stripDashes('co–op'), 'co-op');
  assert.ok(!stripDashes('one — two – three').includes('—'));
});

test('normalizeContentPackage cleans fields and keeps timed cues', () => {
  const pkg = normalizeContentPackage({
    idea: 'an idea — with a dash',
    hook: 'the hook',
    subtitles: [{ text: 'line — one', start: 0, end: 2 }, 'plain line'],
    caption: 'cap',
    hashtags: ['fun', '#already'],
  });
  assert.ok(!pkg.idea.includes('—'));
  assert.equal(pkg.title, 'the hook');
  assert.equal(pkg.subtitles[0].start, 0);
  assert.ok(!pkg.subtitles[0].text.includes('—'));
  assert.deepEqual(pkg.hashtags, ['#fun', '#already']);
});

test('normalizeContentPackage throws when there is no text', () => {
  assert.throws(() => normalizeContentPackage({ hashtags: [] }), /no usable text/);
});

test('captionFileBody composes caption, hashtags and cta', () => {
  const body = captionFileBody({ caption: 'hello', hashtags: ['#a', '#b'], cta: 'follow' });
  assert.ok(body.includes('hello'));
  assert.ok(body.includes('#a #b'));
  assert.ok(body.includes('follow'));
});

test('extractJson handles fenced and chatty output', () => {
  assert.deepEqual(extractJson('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(extractJson('here you go: {"b":2} done'), { b: 2 });
  assert.deepEqual(extractJson('[{"x":1}]'), [{ x: 1 }]);
  assert.equal(extractJson('no json here'), null);
});
