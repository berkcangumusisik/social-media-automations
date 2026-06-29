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

// Fill a rounded rectangle, using the native roundRect when available and a
// manual path otherwise.
function fillRoundRect(ctx, x, y, w, h, r) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, radius);
  } else {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
  ctx.fill();
}

// Draw a decorative solid shape (currently a rounded rectangle), used for accent
// bars and panels in templates.
function drawShape(ctx, shape) {
  const prevAlpha = ctx.globalAlpha;
  ctx.globalAlpha = shape.opacity ?? 1;
  ctx.fillStyle = hexToRgba(shape.color || '#FFFFFF', 1);
  fillRoundRect(ctx, shape.x, shape.y, shape.w, shape.h, shape.radius ?? Math.round(shape.h / 2));
  ctx.globalAlpha = prevAlpha;
}

// Draw one text block: wrap to its box, align, optionally draw a rounded panel
// behind the text (modern caption style), and add a faux outline for legibility.
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
  const cx = align === 'center' ? block.x + block.w / 2 : align === 'right' ? block.x + block.w : block.x;

  // Optional rounded panel behind the text (modern caption look).
  if (block.box) {
    const widths = lines.map((l) => ctx.measureText(l).width);
    const maxW = Math.max(0, ...widths);
    const padX = block.box.padX ?? Math.round(fontPx * 0.45);
    const padY = block.box.padY ?? Math.round(fontPx * 0.3);
    const capTop = top + fontPx * 0.2;
    const lastBaseline = top + (lines.length - 1) * lineHeight + fontPx;
    const textBottom = lastBaseline + fontPx * 0.08;
    const boxW = maxW + padX * 2;
    const boxH = textBottom - capTop + padY * 2;
    let boxX;
    if (align === 'center') boxX = cx - boxW / 2;
    else if (align === 'right') boxX = block.x + block.w - boxW;
    else boxX = block.x - padX;
    const prevAlpha = ctx.globalAlpha;
    ctx.globalAlpha = block.box.opacity ?? 0.55;
    ctx.fillStyle = hexToRgba(block.box.color || '#000000', 1);
    fillRoundRect(ctx, boxX, capTop - padY, boxW, boxH, block.box.radius ?? Math.round(boxH * 0.32));
    ctx.globalAlpha = prevAlpha;
  }

  // Outline radius in pixels. We stamp the text in the outline colour at every
  // integer offset within a filled disk of this radius, then draw the fill on
  // top. A solid disk (not just 8 directions) keeps the outline continuous around
  // small high diacritics like the Turkish breve on g, the dot on I, and umlauts,
  // which an 8-point ring renders as detached ghost marks. With a panel behind
  // the text the outline is off by default for a cleaner look.
  const wantOutline = block.box ? block.outline === true : block.outline !== false;
  const radius = wantOutline ? Math.min(5, Math.max(2, Math.round(fontPx * 0.045))) : 0;
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
    if (block.shape) drawShape(ctx, block);
    else if (block.text && String(block.text).trim()) drawBlock(ctx, block, family);
  }
  await PImage.encodePNGToStream(img, createWriteStream(outPath));
  return outPath;
}

export function overlayPngPath(workdir, name) {
  return join(workdir, `${name}.png`);
}

export const _internal = { wrapLines, hexToRgba, ensureFont, DEFAULT_FONT };
export { dirname };
