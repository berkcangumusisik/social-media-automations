// Shared helpers for templates. Templates describe text as "overlays" made of
// blocks placed in pixel regions derived from the platform safe area. The render
// layer (src/render) rasterizes blocks to PNGs and composites them with FFmpeg.

import { safeBox } from '../platforms/index.js';

export { safeBox };

// A band across the top of the safe area.
export function topBand(preset) {
  const box = safeBox(preset);
  return { x: box.x, y: box.y, w: box.w, h: Math.round(preset.height * 0.24) };
}

// A band anchored to the bottom of the safe area.
export function bottomBand(preset) {
  const box = safeBox(preset);
  const h = Math.round(preset.height * 0.22);
  return { x: box.x, y: box.y + box.h - h, w: box.w, h };
}

// The full safe area, used for centered text.
export function centerBand(preset) {
  return safeBox(preset);
}

// Font size in pixels from a fraction of the frame height.
export function fontPx(preset, fraction) {
  return Math.round(preset.height * fraction);
}

// Build a single static (full duration) overlay from one block.
export function staticOverlay(block, duration) {
  return { blocks: [block], start: 0, end: Math.max(1, duration) };
}

// Turn cues into one overlay per cue (timed).
export function cueOverlays(cues, makeBlock) {
  return cues.map((cue) => ({
    blocks: [makeBlock(cue.text)],
    start: cue.start,
    end: cue.end,
  }));
}

export function autoTimeCues(lines, duration) {
  const clean = lines.map((l) => String(l).trim()).filter(Boolean);
  if (clean.length === 0) return [];
  const span = Math.max(1, duration) / clean.length;
  return clean.map((text, i) => ({
    text,
    start: +(i * span).toFixed(3),
    end: +((i + 1) * span).toFixed(3),
  }));
}

// Normalize content.subtitles into cues:
//  - array of { text, start, end }
//  - array of strings
//  - a single string (split on newlines)
export function toCues(subtitles, duration) {
  if (!subtitles) return [];
  if (typeof subtitles === 'string') {
    return autoTimeCues(subtitles.split('\n'), duration);
  }
  if (Array.isArray(subtitles)) {
    const timed = subtitles.every(
      (s) => s && typeof s === 'object' && Number.isFinite(s.start) && Number.isFinite(s.end)
    );
    if (timed) {
      return subtitles.map((s) => ({ text: s.text, start: s.start, end: s.end }));
    }
    const lines = subtitles.map((s) => (typeof s === 'string' ? s : s.text || ''));
    return autoTimeCues(lines, duration);
  }
  return [];
}
