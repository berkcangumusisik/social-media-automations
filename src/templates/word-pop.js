// word-pop: short, punchy caption lines popping near the center of the frame for
// a karaoke-like feel. Best when subtitles are split into a few words per line.

import { centerBand, fontPx, cueOverlays, toCues, autoTimeCues } from './_helpers.js';

export default {
  name: 'word-pop',
  description: 'Punchy centered captions with a karaoke feel.',
  kind: 'video',
  supports: ['tiktok', 'instagram-reels', 'youtube-shorts'],

  buildPlan(ctx) {
    const { preset, content, duration } = ctx;

    let cues = toCues(content.subtitles, duration);
    if (!cues.length && content.onScreenText) cues = autoTimeCues(String(content.onScreenText).split('\n'), duration);
    if (!cues.length && content.title) cues = autoTimeCues([content.title], duration);

    const overlays = cueOverlays(cues, (text) => ({
      ...centerBand(preset),
      text,
      fontPx: fontPx(preset, 0.062),
      color: '#FFD400',
      align: 'center',
      valign: 'middle',
    }));

    return { kind: 'video', overlays };
  },
};
