// bold-center: one large, punchy line in the middle of the frame. Cover-card
// style for strong hooks. Optional small caption at the bottom if present.

import {
  centerBand,
  bottomBand,
  fontPx,
  staticOverlay,
  cueOverlays,
  toCues,
} from './_helpers.js';

export default {
  name: 'bold-center',
  description: 'Large centered statement line, cover-card style.',
  kind: 'video',
  supports: ['tiktok', 'instagram-reels', 'youtube-shorts'],

  buildPlan(ctx) {
    const { preset, content, duration } = ctx;
    const overlays = [];

    const headline = content.title || content.hook || content.onScreenText || '';
    const cues = toCues(content.subtitles, duration);
    const centerText = headline || (cues[0] && cues[0].text) || '';

    if (centerText) {
      overlays.push(
        staticOverlay(
          { ...centerBand(preset), text: centerText, fontPx: fontPx(preset, 0.075), align: 'center', valign: 'middle' },
          duration
        )
      );
    }

    if (headline && cues.length) {
      overlays.push(
        ...cueOverlays(cues, (text) => ({
          ...bottomBand(preset),
          text,
          fontPx: fontPx(preset, 0.035),
          align: 'center',
          valign: 'middle',
        }))
      );
    }

    return { kind: 'video', overlays };
  },
};
