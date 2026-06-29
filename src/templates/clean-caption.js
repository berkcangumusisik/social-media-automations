// clean-caption: a single caption on a soft dark pill at the bottom safe band.
// Minimal and modern, use when the footage speaks for itself.

import { bottomBand, fontPx, cueOverlays, toCues, autoTimeCues } from './_helpers.js';

export default {
  name: 'clean-caption',
  description: 'Minimal bottom caption on a soft pill, inside the safe area.',
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
      color: '#FFFFFF',
      box: { color: '#0A0A0F', opacity: 0.5 },
    }));

    return { kind: 'video', overlays };
  },
};
