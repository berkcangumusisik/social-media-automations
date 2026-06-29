// word-pop: short, punchy caption lines popping near the center on a brand
// coloured pill, for a karaoke-like highlight feel. Best with a few words per line.

import { centerBand, fontPx, cueOverlays, toCues, autoTimeCues } from './_helpers.js';

export default {
  name: 'word-pop',
  description: 'Punchy centered captions on a brand-coloured pill, karaoke feel.',
  kind: 'video',
  supports: ['tiktok', 'instagram-reels', 'youtube-shorts'],

  buildPlan(ctx) {
    const { preset, content, duration } = ctx;
    const accent = preset.theme?.accent || '#FE2C55';

    let cues = toCues(content.subtitles, duration);
    if (!cues.length && content.onScreenText) cues = autoTimeCues(String(content.onScreenText).split('\n'), duration);
    if (!cues.length && content.title) cues = autoTimeCues([content.title], duration);

    const overlays = cueOverlays(cues, (text) => ({
      ...centerBand(preset),
      text,
      fontPx: fontPx(preset, 0.06),
      align: 'center',
      valign: 'middle',
      color: '#FFFFFF',
      box: { color: accent, opacity: 0.92 },
    }));

    return { kind: 'video', overlays };
  },
};
