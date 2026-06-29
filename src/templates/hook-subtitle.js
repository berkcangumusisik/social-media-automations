// hook-subtitle: a big hook line in the top safe band and timed subtitles in the
// lower safe band. Good default for talking-head style short video.

import { topBand, bottomBand, fontPx, staticOverlay, cueOverlays, toCues } from './_helpers.js';

export default {
  name: 'hook-subtitle',
  description: 'Top hook line plus timed subtitles, kept inside the safe area.',
  kind: 'video',
  supports: ['tiktok', 'instagram-reels', 'youtube-shorts'],

  buildPlan(ctx) {
    const { preset, content, duration } = ctx;
    const overlays = [];

    const hook = content.title || content.hook || content.onScreenText || '';
    if (hook) {
      overlays.push(
        staticOverlay(
          { ...topBand(preset), text: hook, fontPx: fontPx(preset, 0.052), align: 'center', valign: 'top' },
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
        }))
      );
    }

    return { kind: 'video', overlays };
  },
};
