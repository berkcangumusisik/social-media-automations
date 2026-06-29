// hook-subtitle: a hook line on a brand-coloured pill at the top, and timed
// subtitles on a soft dark pill in the lower safe band. Modern caption style,
// all inside the safe area.

import { topBand, bottomBand, fontPx, staticOverlay, cueOverlays, toCues } from './_helpers.js';

export default {
  name: 'hook-subtitle',
  description: 'Top hook pill plus timed caption pills, kept inside the safe area.',
  kind: 'video',
  supports: ['tiktok', 'instagram-reels', 'youtube-shorts'],

  buildPlan(ctx) {
    const { preset, content, duration } = ctx;
    const accent = preset.theme?.accent || '#FE2C55';
    const overlays = [];

    const hook = content.title || content.hook || content.onScreenText || '';
    if (hook) {
      overlays.push(
        staticOverlay(
          {
            ...topBand(preset),
            text: hook,
            fontPx: fontPx(preset, 0.05),
            align: 'center',
            valign: 'top',
            color: '#FFFFFF',
            box: { color: accent, opacity: 0.94 },
          },
          duration
        )
      );
    }

    const cues = toCues(content.subtitles, duration);
    if (cues.length) {
      overlays.push(
        ...cueOverlays(cues, (text) => ({
          ...bottomBand(preset),
          text,
          fontPx: fontPx(preset, 0.04),
          align: 'center',
          valign: 'middle',
          color: '#FFFFFF',
          box: { color: '#0A0A0F', opacity: 0.55 },
        }))
      );
    }

    return { kind: 'video', overlays };
  },
};
