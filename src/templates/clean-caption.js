// clean-caption: minimal single caption track at the bottom safe band. No hook,
// no extra styling. Use when the footage speaks for itself.

import { bottomBand, fontPx, cueOverlays, toCues, autoTimeCues } from './_helpers.js';

export default {
  name: 'clean-caption',
  description: 'Minimal bottom caption only, inside the safe area.',
  kind: 'video',
  supports: ['tiktok', 'instagram-reels', 'youtube-shorts'],

  buildPlan(ctx) {
    const { preset, content, duration } = ctx;

    let cues = toCues(content.subtitles, duration);
    if (!cues.length && content.caption) cues = autoTimeCues(String(content.caption).split('\n'), duration);
    if (!cues.length && content.title) cues = autoTimeCues([content.title], duration);

    const overlays = cueOverlays(cues, (text) => ({
      ...bottomBand(preset),
      text,
      fontPx: fontPx(preset, 0.04),
      align: 'center',
      valign: 'middle',
    }));

    return { kind: 'video', overlays };
  },
};
