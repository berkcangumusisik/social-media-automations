// bold-center: one large centered statement with a short accent bar above it,
// cover-card style. Optional small caption pill at the bottom if present.

import { centerBand, bottomBand, fontPx, cueOverlays, toCues } from './_helpers.js';

export default {
  name: 'bold-center',
  description: 'Large centered statement with an accent bar, cover-card style.',
  kind: 'video',
  supports: ['tiktok', 'instagram-reels', 'youtube-shorts'],

  buildPlan(ctx) {
    const { preset, content, duration } = ctx;
    const accent = preset.theme?.accent || '#FE2C55';
    const cb = centerBand(preset);
    const overlays = [];

    const headline = content.title || content.hook || content.onScreenText || '';
    const cues = toCues(content.subtitles, duration);
    const centerText = headline || (cues[0] && cues[0].text) || '';

    if (centerText) {
      const barW = Math.round(preset.width * 0.2);
      const barH = Math.max(6, Math.round(preset.height * 0.012));
      overlays.push({
        start: 0,
        end: Math.max(1, duration),
        blocks: [
          {
            shape: 'roundrect',
            x: cb.x + (cb.w - barW) / 2,
            y: cb.y + Math.round(cb.h * 0.3),
            w: barW,
            h: barH,
            color: accent,
            radius: Math.round(barH / 2),
          },
          {
            ...cb,
            text: centerText,
            fontPx: fontPx(preset, 0.075),
            align: 'center',
            valign: 'middle',
            color: '#FFFFFF',
          },
        ],
      });
    }

    if (headline && cues.length) {
      overlays.push(
        ...cueOverlays(cues, (text) => ({
          ...bottomBand(preset),
          text,
          fontPx: fontPx(preset, 0.035),
          align: 'center',
          valign: 'middle',
          color: '#FFFFFF',
          box: { color: '#0A0A0F', opacity: 0.5 },
        }))
      );
    }

    return { kind: 'video', overlays };
  },
};
