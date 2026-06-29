// Text rendering to transparent PNG overlays using pureimage (pure JavaScript,
// no native build, no system font dependency). We do this in Node instead of an
// FFmpeg text filter so the tool works on any FFmpeg build, including minimal
// ones without libfreetype or libass. The PNGs are later composited with the
// universally available "overlay" filter.

import * as PImage from 'pureimage';
import { createWriteStream } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DEFAULT_FONT = fileURLToPath(
  new URL('../../assets/fonts/DejaVuSans-Bold.ttf', import.meta.url)
);

// Cache registered fonts by path so we load each TTF once.
const registered = new Map();

export function defaultFontPath() {
  return DEFAULT_FONT;
}

function familyFor(path) {
  return 'f' + Buffer.from(path).toString('hex').slice(0, 12);
}

function ensureFont(path) {
  const fontPath = path || DEFAULT_FONT;
  if (registered.has(fontPath)) return registered.get(fontPath);
  const family = familyFor(fontPath);
  const font = PImage.registerFont(fontPath, family);
  if (typeof font.loadSync === 'function') font.loadSync();
  registered.set(fontPath, family);
  return family;
}

function hexToRgba(hex, alpha = 1) {
  const clean = String(hex || '#FFFFFF').replace('#', '');
  const r = parseInt(clean.slice(0, 2) || 'ff', 16);
  const g = parseInt(clean.slice(2, 4) || 'ff', 16);
  const b = parseInt(clean.slice(4, 6) || 'ff', 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function wrapLines(ctx, text, maxWidth) {
  const out = [];
  for (const paragraph of String(text).split('\n')) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) {
      out.push('');
      continue;
    }
    let line = words[0];
    for (let i = 1; i < words.length; i++) {
      const candidate = `${line} ${words[i]}`;
      if (ctx.measureText(candidate).width <= maxWidth) {
        line = candidate;
      } else {
        out.push(line);
        line = words[i];
      }
    }
    out.push(line);
  }
  return out;
}

// Draw one text block: wrap to its box, align, and add a faux outline by drawing
// the outline colour at eight offsets before the fill colour on top. This avoids
// pureimage strokeText path warnings and reads well over busy video.
function drawBlock(ctx, block, family) {
  const fontPx = block.fontPx;
  ctx.font = `${fontPx}pt ${family}`;
  // Normalize to NFC so decomposed input (a base letter plus a combining
  // diacritic, which some sources produce for Turkish) becomes a single
  // precomposed glyph. pureimage renders per code point and does not position
  // combining marks, so NFD text would otherwise look broken.
  const lines = wrapLines(ctx, String(block.text).normalize('NFC'), block.w);
  const lineHeight = Math.round(fontPx * 1.25);
  const totalHeight = lines.length * lineHeight;

  let top;
  if (block.valign === 'middle') top = block.y + (block.h - totalHeight) / 2;
  else if (block.valign === 'bottom') top = block.y + block.h - totalHeight;
  else top = block.y;

  const align = block.align || 'center';
  ctx.textAlign = align;
  const cx = align === 'center' ? block.x + block.w / 2 : block.x;

  // Outline radius in pixels. We stamp the text in the outline colour at every
  // integer offset within a filled disk of this radius, then draw the fill on
  // top. A solid disk (not just 8 directions) keeps the outline continuous around
  // small high diacritics like the Turkish breve on g, the dot on I, and umlauts,
  // which an 8-point ring renders as detached ghost marks.
  const radius = block.outline === false ? 0 : Math.min(5, Math.max(2, Math.round(fontPx * 0.045)));
  const fill = hexToRgba(block.color || '#FFFFFF');
  const outlineColor = hexToRgba(block.outlineColor || '#000000');

  lines.forEach((line, i) => {
    const baseline = top + i * lineHeight + Math.round(fontPx * 1.0);
    if (radius > 0) {
      ctx.fillStyle = outlineColor;
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          if (dx === 0 && dy === 0) continue;
          if (dx * dx + dy * dy > radius * radius) continue;
          ctx.fillText(line, cx + dx, baseline + dy);
        }
      }
    }
    ctx.fillStyle = fill;
    ctx.fillText(line, cx, baseline);
  });
}

// Render a full-frame transparent PNG containing the given text blocks.
export async function renderOverlayPng({ width, height, blocks, fontPath, outPath }) {
  const family = ensureFont(fontPath);
  const img = PImage.make(width, height);
  const ctx = img.getContext('2d');
  ctx.clearRect(0, 0, width, height);
  for (const block of blocks) {
    if (block.text && String(block.text).trim()) drawBlock(ctx, block, family);
  }
  await PImage.encodePNGToStream(img, createWriteStream(outPath));
  return outPath;
}

export function overlayPngPath(workdir, name) {
  return join(workdir, `${name}.png`);
}

export const _internal = { wrapLines, hexToRgba, ensureFont, DEFAULT_FONT };
export { dirname };
