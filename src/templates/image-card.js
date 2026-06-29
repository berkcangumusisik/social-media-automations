// image-card: an editorial still card for post platforms (LinkedIn, X, Facebook,
// Instagram feed). A short accent bar, a left aligned title, and a lighter caption
// below, on the platform's themed background. Clean and modern, inside the safe area.

import { safeBox, fontPx } from './_helpers.js';

export default {
  name: 'image-card',
  description: 'Editorial still card with an accent bar and title for post platforms.',
  kind: 'image',
  supports: ['instagram-post', 'linkedin-post', 'x-post', 'facebook-post'],

  buildPlan(ctx) {
    const { preset, content } = ctx;
    const accent = preset.theme?.accent || '#0A66C2';
    const box = safeBox(preset);
    const W = preset.width;
    const H = preset.height;
    const blocks = [];

    // Accent kicker bar, top left.
    const barW = Math.round(W * 0.14);
    const barH = Math.max(6, Math.round(H * 0.016));
    blocks.push({
      shape: 'roundrect',
      x: box.x,
      y: box.y,
      w: barW,
      h: barH,
      color: accent,
      radius: Math.round(barH / 2),
    });

    const title = content.title || content.hook || content.onScreenText || '';
    if (title) {
      blocks.push({
        x: box.x,
        y: box.y + Math.round(H * 0.05),
        w: box.w,
        h: Math.round(H * 0.55),
        text: title,
        fontPx: fontPx(preset, 0.062),
        align: 'left',
        valign: 'top',
        color: '#FFFFFF',
        outline: false,
      });
    }

    const sub = content.caption || content.cta || '';
    if (sub) {
      blocks.push({
        x: box.x,
        y: box.y + box.h - Math.round(H * 0.24),
        w: box.w,
        h: Math.round(H * 0.24),
        text: String(sub).slice(0, 180),
        fontPx: fontPx(preset, 0.03),
        align: 'left',
        valign: 'bottom',
        color: '#C9D3DD',
        outline: false,
      });
    }

    return { kind: 'image', overlays: [{ start: 0, end: 1, blocks }] };
  },
};
