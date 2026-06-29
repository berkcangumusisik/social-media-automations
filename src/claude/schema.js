// Content package shape produced by Claude and consumed by templates.
// This module documents the shape, normalizes a parsed package and enforces the
// "no em-dash, human tone" rule as a safety net even if a model slips.

import { ClaudeError } from '../utils/errors.js';

// The shape we ask Claude for (see prompts.js) and normalize to here:
//   {
//     idea:        string   // one line summary of the concept
//     hook:        string   // first on-screen / spoken line
//     title:       string   // headline shown on screen
//     onScreenText:string   // optional extra on-screen text
//     subtitles:   [{ text, start, end }]  // timed caption lines (seconds)
//     caption:     string   // platform caption / description
//     hashtags:    [string]
//     musicMood:   string   // suggested music feel
//     cta:         string   // call to action
//   }

// Replace em-dash / en-dash with a plain hyphen. The prompt forbids them, this
// is just defense in depth so they never reach rendered output or captions.
export function stripDashes(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/\s+[—–]\s+/g, ', ').replace(/[—–]/g, '-');
}

function cleanString(v) {
  // Normalize to NFC so Turkish text from any source uses precomposed glyphs.
  const s = typeof v === 'string' ? v.trim().normalize('NFC') : '';
  return stripDashes(s);
}

function normalizeSubtitles(subs) {
  if (!Array.isArray(subs)) {
    if (typeof subs === 'string') {
      return subs
        .split('\n')
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => ({ text: stripDashes(t) }));
    }
    return [];
  }
  return subs
    .map((s) => {
      if (typeof s === 'string') return { text: cleanString(s) };
      if (s && typeof s === 'object') {
        const cue = { text: cleanString(s.text) };
        if (Number.isFinite(s.start)) cue.start = s.start;
        if (Number.isFinite(s.end)) cue.end = s.end;
        return cue;
      }
      return null;
    })
    .filter((c) => c && c.text);
}

export function normalizeContentPackage(pkg) {
  if (!pkg || typeof pkg !== 'object') {
    throw new ClaudeError('Claude returned a content package that was not an object.');
  }
  const hashtags = Array.isArray(pkg.hashtags)
    ? pkg.hashtags.map((h) => cleanString(String(h)).replace(/^#?/, '#')).filter((h) => h.length > 1)
    : [];

  const normalized = {
    idea: cleanString(pkg.idea),
    hook: cleanString(pkg.hook),
    title: cleanString(pkg.title) || cleanString(pkg.hook),
    onScreenText: cleanString(pkg.onScreenText),
    subtitles: normalizeSubtitles(pkg.subtitles),
    caption: cleanString(pkg.caption),
    hashtags,
    musicMood: cleanString(pkg.musicMood),
    cta: cleanString(pkg.cta),
  };

  const hasText =
    normalized.title || normalized.hook || normalized.subtitles.length || normalized.caption;
  if (!hasText) {
    throw new ClaudeError('Claude content package had no usable text (title, hook, subtitles, caption).');
  }
  return normalized;
}

// Build the "*.caption.txt" body for a package: caption then hashtags.
export function captionFileBody(pkg) {
  const lines = [];
  if (pkg.caption) lines.push(pkg.caption);
  if (pkg.hashtags?.length) lines.push('', pkg.hashtags.join(' '));
  if (pkg.cta) lines.push('', pkg.cta);
  return lines.join('\n') + '\n';
}
